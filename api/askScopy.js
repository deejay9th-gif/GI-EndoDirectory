const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Gemini with the secret API key stored in Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    return res.status(500).json({ reply: "I'm having trouble connecting to my brain. Please try again!" });
  }
}
