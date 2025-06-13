const express = require('express');
const contentController = require('../controllers/contentController');
const router = express.Router();

// Generate educational content
router.post('/generate', contentController.generateContent);

// Export content to various formats
router.post('/export', contentController.exportContent);

// Get available LLM models
router.get('/models', contentController.getModels);

module.exports = router;