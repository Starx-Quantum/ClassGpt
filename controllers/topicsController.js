const Topic = require('../models/Topic');

class TopicsController {
  async getAllTopics(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const topics = await Topic.findAll(limit);

      res.json({
        success: true,
        data: topics,
        count: topics.length
      });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({
        error: 'Failed to fetch topics',
        message: error.message
      });
    }
  }

  async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const topic = await Topic.findById(id);

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found'
        });
      }

      res.json({
        success: true,
        data: topic
      });
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({
        error: 'Failed to fetch topic',
        message: error.message
      });
    }
  }

  async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const result = await Topic.delete(id);

      if (!result.deleted) {
        return res.status(404).json({
          error: 'Topic not found'
        });
      }

      res.json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({
        error: 'Failed to delete topic',
        message: error.message
      });
    }
  }

  async getTopicStats(req, res) {
    try {
      // This would require additional database queries for stats
      res.json({
        success: true,
        stats: {
          total_topics: 0,
          subjects: [],
          difficulty_distribution: {
            beginner: 0,
            intermediate: 0,
            advanced: 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch stats',
        message: error.message
      });
    }
  }
}

module.exports = new TopicsController();
