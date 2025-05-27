import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ValidationService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: 'sk-dummy-key-for-development-only'  // Dummy key for development
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
            
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a survey validation expert. Analyze the survey responses and identify any violations based on the survey guidelines."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            });

            const response = completion.choices[0].message.content;
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