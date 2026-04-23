import { GoogleGenerativeAI } from '@google/generative-ai';

// Notice: We completely removed the `runtime: 'edge'` configuration.
// We are back on Vercel's incredibly stable standard Node.js network.

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Extract the compressed text payload we set up in index.html
    const { text, systemPrompt } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing prompt text' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'Server Configuration Error: API key is missing.' });
    }

    // 3. Initialize the official Google SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // The SDK will automatically handle regional routing for this model
      systemInstruction: systemPrompt,
    });

    // 4. Fetch the response from Gemini
    const result = await model.generateContent(text);
    const response = await result.response;
    const aiText = response.text();

    // 5. Send the successful reply back to the frontend
    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Backend Error:", error);
    
    // 6. Graceful error handling
    return res.status(500).json({ 
      reply: "My connection wobbled for a second! Let me catch my breath. Could you ask that one more time?" 
    });
  }
}
