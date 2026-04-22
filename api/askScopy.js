export const config = {
  runtime: 'edge',
};
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Explicit check for the API key
    if (!apiKey) {
      return res.status(500).json({ 
        reply: "Backend Error: GEMINI_API_KEY is missing in Vercel Environment Variables. Please add it and REDEPLOY." 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { text, systemPrompt } = req.body;

    // Use the latest Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(text);
    const response = await result.response;
    
    return res.status(200).json({ reply: response.text() });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return the specific error message to the UI for debugging
    return res.status(500).json({ 
      reply: `Gemini API Error: ${error.message}. Please check your API key status and quota.` 
    });
  }
}
