const Joi = require('joi');

const generateContentSchema = Joi.object({
  topic: Joi.string().min(2).max(200).required(),
  subject: Joi.string().min(2).max(100).required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
  content_type: Joi.string().valid('notes', 'slides', 'mcqs', 'all').required(),
  mcq_count: Joi.number().integer().min(5).max(50).default(10),
  slide_count: Joi.number().integer().min(5).max(20).default(12),
  custom_instructions: Joi.string().max(500).allow('').default('')
});

const exportSchema = Joi.object({
  format: Joi.string().valid('markdown', 'pdf', 'html', 'json').required(),
  content: Joi.string().required(),
  filename: Joi.string().regex(/^[a-zA-Z0-9_-]+$/).required()
});

module.exports = {
  generateContentSchema,
  exportSchema
};