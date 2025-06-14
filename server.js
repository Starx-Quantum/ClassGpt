const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// File export dependencies
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Simple file-based database
const DB_PATH = path.join(__dirname, 'data');
const TOPICS_FILE = path.join(DB_PATH, 'topics.json');
const EXPORTS_DIR = path.join(__dirname, 'exports');

// Ensure directories exist
async function initializeDirectories() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    
    // Initialize topics file if it doesn't exist
    try {
      await fs.access(TOPICS_FILE);
    } catch {
      await fs.writeFile(TOPICS_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing directories:', error);
  }
}

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Available models with their strengths
const MODELS = {
  mistral: {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    strength: 'Speed and Responsiveness',
    bestFor: 'Quick responses and formatting'
  },
  gemma: {
    id: 'google/gemma-7b-it:free',
    name: 'Gemma 7B',
    strength: 'High-Quality Text Generation',
    bestFor: 'Educational content and explanations'
  },
  hermes: {
    id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free',
    name: 'Nous Hermes Mixtral',
    strength: 'In-depth Knowledge',
    bestFor: 'Complex academic topics'
  }
};

// Database helpers
async function loadTopics() {
  try {
    const data = await fs.readFile(TOPICS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading topics:', error);
    return [];
  }
}

async function saveTopics(topics) {
  try {
    await fs.writeFile(TOPICS_FILE, JSON.stringify(topics, null, 2));
  } catch (error) {
    console.error('Error saving topics:', error);
  }
}

async function addTopic(topic) {
  const topics = await loadTopics();
  const newTopic = {
    id: uuidv4(),
    title: topic,
    createdAt: new Date().toISOString(),
    accessCount: 1
  };
  topics.push(newTopic);
  await saveTopics(topics);
  return newTopic;
}

async function updateTopicAccess(topicTitle) {
  const topics = await loadTopics();
  const topic = topics.find(t => t.title.toLowerCase() === topicTitle.toLowerCase());
  if (topic) {
    topic.accessCount++;
    topic.lastAccessed = new Date().toISOString();
    await saveTopics(topics);
  }
}

// OpenRouter API helper
async function callOpenRouter(model, prompt, maxTokens = 2000) {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'ClassGPT'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error(`AI API Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Content generation prompts
const PROMPTS = {
  notes: (topic) => `Create comprehensive study notes for the topic: "${topic}". 
Structure the notes with:
- Clear headings and subheadings
- Key concepts and definitions
- Important points and examples
- Practical applications
- Summary points

Format in clean, well-organized markdown. Make it educational and easy to understand.`,

  slides: (topic) => `Create a presentation outline for: "${topic}".
Generate 8-12 slides with:
- Title slide
- Overview/Agenda
- Main concept slides (5-8 slides)
- Key takeaways
- Conclusion

For each slide, provide:
- Slide title
- 3-5 bullet points with concise content
- Speaker notes (if needed)

Format as structured markdown with clear slide breaks.`,

  mcqs: (topic) => `Create 10 multiple choice questions for the topic: "${topic}".
For each question:
- Write a clear, challenging question
- Provide 4 options (A, B, C, D)
- Mark the correct answer
- Provide a detailed explanation

Format as:
**Question X:** [Question text]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation]

Make questions varied in difficulty and cover different aspects of the topic.`
};

// File export helpers
async function exportToMarkdown(content, filename) {
  const filePath = path.join(EXPORTS_DIR, `${filename}.md`);
  await fs.writeFile(filePath, content);
  return filePath;
}

async function exportToPDF(content, filename) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const md = new MarkdownIt();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #2c3e50; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      ${md.render(content)}
    </body>
    </html>
  `;
  
  await page.setContent(html);
  const filePath = path.join(EXPORTS_DIR, `${filename}.pdf`);
  await page.pdf({ 
    path: filePath,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
  });
  
  await browser.close();
  return filePath;
}

async function exportToPPTX(slidesContent, filename) {
  const pptx = new PptxGenJS();
  
  // Parse slides from markdown content
  const slides = slidesContent.split('---').filter(slide => slide.trim());
  
  slides.forEach((slideContent, index) => {
    const slide = pptx.addSlide();
    const lines = slideContent.trim().split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // First line as title
      const title = lines[0].replace(/^#+\s*/, '').trim();
      slide.addText(title, {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 24, bold: true, color: '2c3e50'
      });
      
      // Rest as content
      const content = lines.slice(1).join('\n');
      slide.addText(content, {
        x: 0.5, y: 2, w: 9, h: 5,
        fontSize: 16, color: '34495e'
      });
    }
  });
  
  const filePath = path.join(EXPORTS_DIR, `${filename}.pptx`);
  await pptx.writeFile({ fileName: filePath });
  return filePath;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    models: Object.keys(MODELS)
  });
});

// Get available models
app.get('/api/models', (req, res) => {
  res.json({ models: MODELS });
});

// Generate content
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, type, model = 'gemma' } = req.body;
    
    if (!topic || !type) {
      return res.status(400).json({ error: 'Topic and type are required' });
    }
    
    if (!MODELS[model]) {
      return res.status(400).json({ error: 'Invalid model selected' });
    }
    
    if (!['notes', 'slides', 'mcqs'].includes(type)) {
      return res.status(400).json({ error: 'Type must be notes, slides, or mcqs' });
    }
    
    const prompt = PROMPTS[type](topic);
    const modelId = MODELS[model].id;
    
    console.log(`Generating ${type} for topic: ${topic} using model: ${model}`);
    
    const content = await callOpenRouter(modelId, prompt);
    
    // Update topic access
    await updateTopicAccess(topic);
    
    res.json({
      success: true,
      topic,
      type,
      model,
      content,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
});

// Generate complete study kit
app.post('/api/generate-all', async (req, res) => {
  try {
    const { topic, model = 'gemma' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    if (!MODELS[model]) {
      return res.status(400).json({ error: 'Invalid model selected' });
    }
    
    console.log(`Generating complete study kit for: ${topic}`);
    
    const modelId = MODELS[model].id;
    
    // Generate all content types
    const [notes, slides, mcqs] = await Promise.all([
      callOpenRouter(modelId, PROMPTS.notes(topic)),
      callOpenRouter(modelId, PROMPTS.slides(topic)),
      callOpenRouter(modelId, PROMPTS.mcqs(topic))
    ]);
    
    // Add to topics database
    await addTopic(topic);
    
    res.json({
      success: true,
      topic,
      model,
      content: {
        notes,
        slides,
        mcqs
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Complete generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate complete study kit',
      details: error.message 
    });
  }
});

// Export content
app.post('/api/export', async (req, res) => {
  try {
    const { content, format, filename } = req.body;
    
    if (!content || !format || !filename) {
      return res.status(400).json({ error: 'Content, format, and filename are required' });
    }
    
    if (!['md', 'pdf', 'pptx'].includes(format)) {
      return res.status(400).json({ error: 'Format must be md, pdf, or pptx' });
    }
    
    let filePath;
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    switch (format) {
      case 'md':
        filePath = await exportToMarkdown(content, safeFilename);
        break;
      case 'pdf':
        filePath = await exportToPDF(content, safeFilename);
        break;
      case 'pptx':
        filePath = await exportToPPTX(content, safeFilename);
        break;
    }
    
    res.json({
      success: true,
      filename: path.basename(filePath),
      downloadUrl: `/api/download/${path.basename(filePath)}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export content',
      details: error.message 
    });
  }
});

// Download exported file
app.get('/api/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(EXPORTS_DIR, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).json({ error: 'File not found' });
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Get topics
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await loadTopics();
    
    // Sort by access count and recent access
    const sortedTopics = topics.sort((a, b) => {
      if (b.accessCount !== a.accessCount) {
        return b.accessCount - a.accessCount;
      }
      return new Date(b.lastAccessed || b.createdAt) - new Date(a.lastAccessed || a.createdAt);
    });
    
    res.json({
      success: true,
      topics: sortedTopics,
      total: topics.length
    });
    
  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({ 
      error: 'Failed to load topics',
      details: error.message 
    });
  }
});

// Search topics
app.get('/api/topics/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const topics = await loadTopics();
    const filteredTopics = topics.filter(topic => 
      topic.title.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({
      success: true,
      topics: filteredTopics,
      query: q,
      total: filteredTopics.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search topics',
      details: error.message 
    });
  }
});

// Delete topic
app.delete('/api/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const topics = await loadTopics();
    const filteredTopics = topics.filter(topic => topic.id !== id);
    
    if (topics.length === filteredTopics.length) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    await saveTopics(filteredTopics);
    
    res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete topic',
      details: error.message 
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const topics = await loadTopics();
    
    const stats = {
      totalTopics: topics.length,
      totalGenerations: topics.reduce((sum, topic) => sum + topic.accessCount, 0),
      popularTopics: topics
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5)
        .map(topic => ({ title: topic.title, count: topic.accessCount })),
      recentTopics: topics
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(topic => ({ title: topic.title, createdAt: topic.createdAt }))
    };
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to load statistics',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeDirectories();
    
    app.listen(PORT, () => {
      console.log(`
🚀 ClassGPT Backend Server Started!
📡 Server running on port ${PORT}
🔗 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/api/health

Available Endpoints:
- POST /api/generate - Generate single content type
- POST /api/generate-all - Generate complete study kit
- POST /api/export - Export content to file
- GET /api/download/:filename - Download exported files
- GET /api/topics - Get all topics
- GET /api/topics/search - Search topics
- DELETE /api/topics/:id - Delete topic
- GET /api/stats - Get usage statistics
- GET /api/models - Get available AI models

🤖 Available AI Models:
${Object.entries(MODELS).map(([key, model]) => 
  `- ${key}: ${model.name} (${model.bestFor})`
).join('\n')}

⚠️  Make sure to set OPENROUTER_API_KEY environment variable!
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;