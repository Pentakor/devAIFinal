import { ZodError } from 'zod';

/**
 * Express middleware to validate request bodies using a Zod schema.
 * 
 * @param {Object} schema - A Zod schema object
 * @returns {Function} Middleware function for Express
 *
 * @example
 * router.post('/users', validate(userSchema), createUser);
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 'fail',
          errors: err.errors
        });
      } else {
        next(err);
      }
    }
  };
};

export default validate;
