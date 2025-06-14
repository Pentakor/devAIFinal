import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getPrompt, loadPrompts } from '../utils/promptLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptsDir = path.join(__dirname, '..', 'prompts');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const generateAISummary = async (prompt) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a survey analysis expert. Your task is to analyze survey responses and generate a comprehensive summary."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0].message.content;
        
        // Parse the JSON response
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Invalid AI response format');
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw new Error('Failed to generate summary');
    }
};

export const validateSurveyResponses = async (prompt) => {
    try {
        console.log('Starting AI validation with prompt:', prompt);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a survey validation expert. Your task is to analyze survey responses and identify violations of survey guidelines."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3, // Lower temperature for more consistent validation
            max_tokens: 1000
        });

        const response = completion.choices[0].message.content;
        console.log('Raw AI response:', response);
        
        // Parse the JSON response
        try {
            const parsedResponse = JSON.parse(response);
            console.log('Parsed validation response:', parsedResponse);
            return parsedResponse;
        } catch (error) {
            console.error('Error parsing validation response:', error);
            console.error('Raw response that failed to parse:', response);
            throw new Error(`Invalid validation response format: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in validateSurveyResponses:', error);
        if (error.response) {
            console.error('OpenAI API error details:', error.response.data);
        }
        throw new Error(`Failed to validate survey responses: ${error.message}`);
    }
};

export const searchSurveys = async (query, surveyData) => {
    try {
        console.log('Starting AI search with query:', query);
        
        // Load all prompts
        const prompts = await loadPrompts(promptsDir);
        if (!prompts || !prompts.searchPrompt) {
            throw new Error('Search prompt template not found');
        }

        // Fill in the prompt template
        const filledPrompt = prompts.searchPrompt
            .replace('{query}', query)
            .replace('{surveyData}', JSON.stringify(surveyData));
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a survey search expert. Your task is to analyze the natural language query and find relevant surveys based on their content and metadata."
                },
                {
                    role: "user",
                    content: filledPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const response = completion.choices[0].message.content;
        console.log('Raw AI search response:', response);
        
        // Parse the JSON response
        try {
            const parsedResponse = JSON.parse(response);
            console.log('Parsed search response:', parsedResponse);
            return parsedResponse;
        } catch (error) {
            console.error('Error parsing search response:', error);
            console.error('Raw response that failed to parse:', response);
            throw new Error(`Invalid search response format: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in searchSurveys:', error);
        if (error.response) {
            console.error('OpenAI API error details:', error.response.data);
        }
        throw new Error(`Failed to search surveys: ${error.message}`);
    }
}; 