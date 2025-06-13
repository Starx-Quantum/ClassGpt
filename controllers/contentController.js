const llmService = require('../services/llmService');
const exportService = require('../services/exportService');
const Topic = require('../models/Topic');
const { generateContentSchema, exportSchema } = require('../utils/validators');
const PromptTemplates = require('../utils/prompts');

class ContentController {
  async generateContent(req, res) {
    try {
      const { error, value } = generateContentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { topic, subject, difficulty, content_type, mcq_count, slide_count, custom_instructions } = value;

      let result = {
        topic,
        subject,
        difficulty,
        generated_at: new Date().toISOString()
      };

      // Generate based on content type
      if (content_type === 'notes' || content_type === 'all') {
        console.log(`📝 Generating notes for: ${topic}`);
        result.notes = await llmService.generateNotes(topic, subject, difficulty);
      }

      if (content_type === 'slides' || content_type === 'all') {
        console.log(`📊 Generating slides for: ${topic}`);
        result.slides = await llmService.generateSlides(topic, subject, difficulty);
      }

      if (content_type === 'mcqs' || content_type === 'all') {
        console.log(`❓ Generating MCQs for: ${topic}`);
        result.mcqs = await llmService.generateMCQs(topic, subject, difficulty, mcq_count);
      }

      // Save to database
      const savedTopic = await Topic.create({
        title: topic,
        subject,
        difficulty,
        content_type,
        generated_content: result
      });

      result.id = savedTopic.id;

      res.json({
        success: true,
        data: result,
        message: `Successfully generated ${content_type} for ${topic}`
      });

    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({
        error: 'Failed to generate content',
        message: error.message
      });
    }
  }

  async exportContent(req, res) {
    try {
      const { error, value } = exportSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { format, content, filename } = value;
      let filepath;

      switch (format) {
        case 'markdown':
          filepath = await exportService.exportMarkdown(content, filename);
          break;
        case 'pdf':
          filepath = await exportService.exportPDF(content, filename);
          break;
        case 'html':
          filepath = await exportService.exportHTML(content, filename);
          break;
        case 'json':
          filepath = await exportService.exportJSON(JSON.parse(content), filename);
          break;
        default:
          return res.status(400).json({ error: 'Unsupported export format' });
      }

      const downloadUrl = exportService.getDownloadUrl(filepath);

      res.json({
        success: true,
        download_url: downloadUrl,
        filename: path.basename(filepath),
        format
      });

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        error: 'Failed to export content',
        message: error.message
      });
    }
  }

  async getModels(req, res) {
    res.json({
      models: {
        fast: {
          name: 'mistralai/mistral-7b-instruct:free',
          description: 'Fast and responsive, excellent for quick generation',
          best_for: 'Quick notes and basic content'
        },
        balanced: {
          name: 'google/gemma-7b-it:free',
          description: 'High-quality text generation with good coherence',
          best_for: 'Detailed notes and MCQ explanations'
        },
        detailed: {
          name: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free',
          description: 'Comprehensive and detailed content generation',
          best_for: 'Complex topics requiring deeper understanding'
        }
      }
    });
  }
}

module.exports = new ContentController();
