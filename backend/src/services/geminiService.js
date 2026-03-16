const { getModel } = require('../config/gemini');

const FALLBACK = {
  category: 'Administration',
  priority: 'Medium',
  sentiment: 'neutral',
  keywords: [],
  suggestedResponse: 'Your complaint has been received and will be processed.',
};

const analyzeComplaint = async (title, description, language = 'en') => {
  try {
    const model = getModel('gemini-1.5-flash');
    const prompt = `Analyze the following university student complaint and respond with ONLY a JSON object (no markdown, no code blocks).

Title: ${title}
Description: ${description}
Language: ${language}

Return exactly this JSON structure:
{
  "category": "<one of: Academic Affairs, Examination, Hostel & Accommodation, Library, Sports & Recreation, Transportation, Scholarship & Financial Aid, IT Services, Student Welfare, Campus Safety & Security, Health Services, Canteen & Food Services, Administration>",
  "priority": "<one of: Low, Medium, High, Critical>",
  "sentiment": "<one of: positive, neutral, negative>",
  "keywords": ["keyword1", "keyword2"],
  "suggestedResponse": "<a helpful suggested response for the department>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let cleaned = text;
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    const validCategories = [
      'Academic Affairs', 'Examination', 'Hostel & Accommodation', 'Library',
      'Sports & Recreation', 'Transportation', 'Scholarship & Financial Aid',
      'IT Services', 'Student Welfare', 'Campus Safety & Security',
      'Health Services', 'Canteen & Food Services', 'Administration',
    ];
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const validSentiments = ['positive', 'neutral', 'negative'];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : 'Administration',
      priority: validPriorities.includes(parsed.priority) ? parsed.priority : 'Medium',
      sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      suggestedResponse: typeof parsed.suggestedResponse === 'string' ? parsed.suggestedResponse : FALLBACK.suggestedResponse,
    };
  } catch (err) {
    console.error('Gemini analysis failed:', err.message);
    return FALLBACK;
  }
};

module.exports = { analyzeComplaint };
