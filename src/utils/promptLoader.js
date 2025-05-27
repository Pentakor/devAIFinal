import fs from 'fs/promises';
import path from 'path';

const REQUIRED_PROMPTS = [
    'searchPrompt.txt',
    'validatePrompt.txt',
    'summaryPrompt.txt'
];

export const loadPrompts = async (promptsDir) => {
    try {
        // Check if prompts directory exists
        try {
            await fs.access(promptsDir);
        } catch (error) {
            throw new Error(`Prompts directory not found at ${promptsDir}`);
        }

        // Load all required prompts
        const prompts = {};
        for (const promptFile of REQUIRED_PROMPTS) {
            const promptPath = path.join(promptsDir, promptFile);
            try {
                const content = await fs.readFile(promptPath, 'utf-8');
                prompts[promptFile.replace('.txt', '')] = content;
            } catch (error) {
                throw new Error(`Failed to load prompt file: ${promptFile}`);
            }
        }

        return prompts;
    } catch (error) {
        throw new Error(`Failed to load prompts: ${error.message}`);
    }
};

export const getPrompt = (prompts, promptName) => {
    if (!prompts[promptName]) {
        throw new Error(`Prompt not found: ${promptName}`);
    }
    return prompts[promptName];
}; 