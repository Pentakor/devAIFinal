import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateTestUser = (includePassword = false) => {
  const plainPassword = 'password123'; // Consistent test password
  const userData = {
    username: faker.internet.username().replace(/[^a-zA-Z0-9_-]/g, ''),
    email: faker.internet.email(),
    passwordHash: bcrypt.hashSync(plainPassword, 10),
    role: 'user',
    isActive: true
  };
  
  // Return plain password for login tests
  if (includePassword) {
    userData.password = plainPassword;
  }
  
  return userData;
};

export const generateTestSurvey = (creatorId) => ({
  creator: creatorId,
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  area: faker.lorem.words(2),
  question: 'how would you like to improve the school playground?',
  guidelines: {
    permittedDomains: 'what we want to keep, what we want to improve',
    permittedResponses: 'Use proper language. Limit your response to two paragraphs.',
    summaryInstructions: 'Make the summary readable by 6-8 graders, and introduce some humor.'
  },
  expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
  isClosed: false,
  questions: [
    {
      type: 'multiple-choice',
      question: 'What is your favorite color?',
      options: ['Red', 'Blue', 'Green']
    },
    {
      type: 'text',
      question: 'Why do you like this color?'
    }
  ]
});

export const generateTestOpinion = (surveyId) => ({
  content: faker.lorem.paragraph(),
  sentiment: faker.helpers.arrayElement(['positive', 'negative', 'neutral'])
});

export const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const createTestUser = async (User, includePassword = false) => {
  const userData = generateTestUser(includePassword);
  const user = await User.create(userData);
  return { user, userData };
};

export const createTestSurvey = async (Survey, userId) => {
  const surveyData = generateTestSurvey(userId);
  const survey = await Survey.create(surveyData);
  return { survey, surveyData };
};