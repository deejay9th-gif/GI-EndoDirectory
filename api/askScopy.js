import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Safely parse the body whether Vercel sends it as a string or an object
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { text, systemPrompt } = body;

    if (!text) {
      return res.status(400).json({ reply: 'Diagnostic Error: Prompt text is missing from the request.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'Diagnostic Error: GEMINI_API_KEY environment variable is missing.' });
    }

    // 2. Initialize the SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    // 3. Call Gemini
    const result = await model.generateContent(text);
    const response = await result.response;
    const aiText = response.text();

    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Backend Error:", error);
    
    // 4. PRINT THE EXACT CRASH MESSAGE TO THE CHAT
    return res.status(500).json({ 
      reply: `Node.js Crash: ${error.message}` 
    });
  }
}
