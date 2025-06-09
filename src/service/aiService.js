import OpenAI from 'openai';
import dotenv from 'dotenv';

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