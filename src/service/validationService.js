import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ValidationService {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-development-only'
        });
        this.validatePrompt = null;
        this.loadPrompts();
    }

    async loadPrompts() {
        try {
            const promptsDir = path.join(__dirname, '..', 'prompts');
            this.validatePrompt = await fs.readFile(
                path.join(promptsDir, 'validatePrompt.txt'),
                'utf-8'
            );
        } catch (error) {
            console.error('Error loading prompts:', error);
            throw new Error('Failed to load validation prompts');
        }
    }

    async validateSurveyResponses(surveyResponses) {
        if (!this.validatePrompt) {
            await this.loadPrompts();
        }

        try {
            const prompt = this.validatePrompt.replace('{surveyResponses}', JSON.stringify(surveyResponses));
            
            const message = await this.anthropic.messages.create({
                model: "claude-3-opus-20240229",
                max_tokens: 500,
                temperature: 0.3,
                system: "You are a survey validation expert. Analyze the survey responses and identify any violations based on the survey guidelines.",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const response = message.content[0].text;
            const validationResults = JSON.parse(response);

            // Transform the results to match the required format
            return validationResults.violations.map(violation => ({
                surveyId: violation.surveyUri.split('/').pop(),
                responseId: violation.responseId,
                reason: violation.explanation
            }));
        } catch (error) {
            console.error('Error validating survey responses:', error);
            throw new Error('Failed to validate survey responses');
        }
    }
}

export default new ValidationService(); 