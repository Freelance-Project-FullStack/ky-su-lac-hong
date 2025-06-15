const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 Validation debug:');
    console.log('- Request body:', req.body);

    const { error } = schema.validate(req.body);
    if (error) {
      console.log('❌ Validation failed:', error.details.map(detail => detail.message));
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    console.log('✅ Validation passed');
    next();
  };
};

const schemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must be at most 20 characters long'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long'
      })
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  createRoom: Joi.object({
    roomName: Joi.string().min(3).max(30).required(),
    maxPlayers: Joi.number().min(2).max(4).default(4),
    isPrivate: Joi.boolean().default(false),
    password: Joi.string().min(4).max(20).when('isPrivate', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  joinRoom: Joi.object({
    password: Joi.string().optional()
  }),

  updateRoom: Joi.object({
    roomName: Joi.string().min(3).max(30).optional(),
    maxPlayers: Joi.number().integer().min(2).max(4).optional(),
    isPrivate: Joi.boolean().optional(),
    password: Joi.string().allow('', null).optional()
  }).custom((value, helpers) => {
    // Custom validation for password when isPrivate is true
    if (value.isPrivate && (!value.password || value.password.length < 4)) {
      return helpers.error('password.required');
    }
    return value;
  }),

  updateProfile: Joi.object({
    avatar: Joi.string().optional(),
    preferences: Joi.object({
      soundEnabled: Joi.boolean(),
      musicEnabled: Joi.boolean(),
      animationsEnabled: Joi.boolean(),
      language: Joi.string().valid('vi', 'en')
    }).optional()
  })
};

module.exports = {
  validate,
  schemas
};
