const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const getModel = (modelName = 'gemini-1.5-flash') => {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
};

module.exports = { getGeminiClient, getModel };
