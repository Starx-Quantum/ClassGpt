const readmeContent = `# ClassGPT Backend API

🎓 AI Professor that generates educational content using free LLM models from OpenRouter.

## Features

- 📄 **Notes Generation**: Comprehensive study notes for any topic
- 📊 **Slide Creation**: Professional presentation slides in Markdown/HTML
- ❓ **MCQ Generation**: Multiple choice questions with detailed explanations
- 📁 **File Export**: Export to PDF, HTML, Markdown, and JSON formats
- 💾 **Topic Management**: Save and reuse generated content
- 🚀 **Multiple LLM Models**: Choose from fast, balanced, or detailed generation

## Quick Start

### 1. Installation

\`\`\`bash
git clone <repository-url>
cd classgpt-backend
npm install
\`\`\`

### 2. Environment Setup

\`\`\`bash
cp .env.example .env
# Edit .env with your OpenRouter API key
\`\`\`

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Content Generation

**POST** \`/api/content/generate\`

Generate educational content for any topic.

\`\`\`json
{
  "topic": "Operating Systems Deadlock",
  "subject": "Computer Science",
  "difficulty": "intermediate",
  "content_type": "all",
  "mcq_count": 10,
  "slide_count": 12
}
\`\`\`

### Content Export

**POST** \`/api/content/export\`

Export generated content to various formats.

\`\`\`json
{
  "format": "pdf",
  "content": "