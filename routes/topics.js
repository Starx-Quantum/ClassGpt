const express = require('express');
const topicsController = require('../controllers/topicsController');
const router = express.Router();

// Get all topics
router.get('/', topicsController.getAllTopics);

// Get topic by ID
router.get('/:id', topicsController.getTopicById);

// Delete topic
router.delete('/:id', topicsController.deleteTopic);

// Get topic statistics
router.get('/stats/overview', topicsController.getTopicStats);

module.exports = router;
