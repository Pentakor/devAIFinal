import { z } from 'zod';

/**
 * Zod schema to validate poll creation input:
 * - creator: non-empty string
 * - question: non-empty string
 * - options: at least two non-empty strings
 */
export const pollSchema = z.object({
  creator: z.string().min(1, "Creator is required"),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1)).min(2, "At least two options are required"),
}).strict();

/**
 * Zod schema to validate a username:
 * - username: non-empty string
 */
export const usernameSchema = z.object({
  username: z.string().min(1, "Username is required"),
}).strict();

/**
 * Zod schema to validate a vote submission:
 * - username: non-empty string
 * - optionId: non-negative integer
 */
export const voteSchema = z.object({
  username: z.string().min(1, "Username is required"),
  optionId: z.number().int().nonnegative("Option ID must be a non-negative integer"),
}).strict();
