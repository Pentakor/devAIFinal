import Joi from 'joi';

/**
 * Express middleware to validate request bodies using a Joi schema.
 * 
 * @param {Object} schema - A Joi schema object
 * @returns {Function} Middleware function for Express
 *
 * @example
 * router.post('/users', validate(userSchema), createUser);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      messages: {
        'string.empty': '{#label} is required',
        'string.min': '{#label} must be at least {#limit} characters long',
        'any.required': '{#label} is required',
        'string.email': 'Please provide a valid email address',
        'object.base': 'Invalid request format',
        'array.base': 'Invalid request format'
      }
    });

    if (error) {
      const errorMessage = error.details.map(detail => {
        // Get the field name without quotes
        const field = detail.path.join('.');
        // Get the message and remove any quotes
        const message = detail.message.replace(/"/g, '');
        
        return {
          field,
          message
        };
      });

      return res.status(400).json({
        status: 'fail',
        errors: errorMessage
      });
    }

    next();
  };
};

export default validate;
