const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    
    this.models = {
      fast: 'mistralai/mistral-7b-instruct:free',
      balanced: 'google/gemma-7b-it:free',
      detailed: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free'
    };
  }

  async generateContent(prompt, model = 'balanced', maxTokens = 2000) {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.models[model] || this.models.balanced,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'ClassGPT - AI Professor'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate content from LLM');
    }
  }

  async generateNotes(topic, subject, difficulty = 'intermediate') {
    const prompt = `You are an expert professor. Generate comprehensive study notes for the topic "${topic}" in ${subject}. 
    
Difficulty level: ${difficulty}

Please structure the notes with:
1. Introduction and overview
2. Key concepts and definitions
3. Detailed explanations with examples
4. Important formulas/principles (if applicable)
5. Real-world applications
6. Summary and key takeaways

Format the response in clean markdown. Be thorough but concise. Include practical examples where relevant.`;

    return await this.generateContent(prompt, 'detailed', 3000);
  }

  async generateSlides(topic, subject, difficulty = 'intermediate') {
    const prompt = `Create presentation slides in markdown format for "${topic}" in ${subject}.
    
Difficulty: ${difficulty}

Format as a complete slide deck with:
- Title slide
- Agenda/Overview
- 8-12 content slides with clear headings
- Each slide should have 3-5 bullet points maximum
- Include practical examples
- Conclusion slide

Use this format:
# Slide Title
## Subtitle (if needed)
- Bullet point 1
- Bullet point 2
- Bullet point 3

Make it engaging and suitable for a ${difficulty} level audience.`;

    return await this.generateContent(prompt, 'balanced', 2500);
  }

  async generateMCQs(topic, subject, difficulty = 'intermediate', count = 10) {
    const prompt = `Generate ${count} multiple choice questions about "${topic}" in ${subject}.

Difficulty: ${difficulty}

For each question, provide:
1. Question text
2. 4 options (A, B, C, D)
3. Correct answer
4. Detailed explanation

Format as JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "Option A",
        "B": "Option B", 
        "C": "Option C",
        "D": "Option D"
      },
      "correct_answer": "B",
      "explanation": "Detailed explanation of why B is correct and others are wrong."
    }
  ]
}

Ensure questions test understanding, not just memorization.`;

    const response = await this.generateContent(prompt, 'detailed', 3000);
    
    try {
      return JSON.parse(response);
    } catch (e) {
      // Fallback if JSON parsing fails
      return {
        questions: [],
        error: 'Failed to parse MCQ response',
        raw_response: response
      };
    }
  }
}

module.exports = new LLMService();
