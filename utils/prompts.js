class PromptTemplates {
  static getNotesPrompt(topic, subject, difficulty, customInstructions = '') {
    return `You are an expert ${subject} professor. Create comprehensive study notes for "${topic}".

Difficulty Level: ${difficulty}
Subject: ${subject}
${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Structure your notes with:
# ${topic} - Study Notes

## 1. Introduction & Overview
## 2. Key Concepts & Definitions  
## 3. Detailed Explanations
## 4. Examples & Applications
## 5. Important Formulas/Principles
## 6. Common Misconceptions
## 7. Practice Tips
## 8. Summary & Key Takeaways

Use markdown formatting. Include practical examples and make it engaging for ${difficulty} level students.`;
  }

  static getSlidesPrompt(topic, subject, difficulty, slideCount = 12) {
    return `Create a ${slideCount}-slide presentation for "${topic}" in ${subject}.

Difficulty: ${difficulty}
Target Audience: ${difficulty} level students

Format each slide as:
---
# Slide X: Title
## Subtitle (if needed)
- Key point 1
- Key point 2  
- Key point 3
---

Include:
- Title slide
- Overview/Agenda  
- ${slideCount - 3} content slides
- Conclusion slide

Keep each slide focused and visually appealing. Use examples and analogies appropriate for ${difficulty} level.`;
  }

  static getMCQPrompt(topic, subject, difficulty, count = 10) {
    return `Generate ${count} high-quality multiple choice questions for "${topic}" in ${subject}.

Difficulty: ${difficulty}
Question Count: ${count}

Requirements:
- Test conceptual understanding, not just memorization
- Include application-based questions
- Provide detailed explanations
- Ensure distractors are plausible

Return as valid JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct_answer": "A",
      "explanation": "Why A is correct and others are wrong.",
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }
  ]
}`;
  }
}

module.exports = PromptTemplates;