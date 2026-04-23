export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ reply: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { text, systemPrompt } = body;

    if (!text) {
      return res.status(200).json({ reply: 'Error: Prompt text is missing.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ reply: 'Error: GEMINI_API_KEY is missing in Vercel.' });
    }

    const apiKey = process.env.GEMINI_API_KEY.trim(); 
    
    // Upgrading to the active 2.5 Flash model!
    const combinedPrompt = systemPrompt + "\n\nUser Question: " + text;
    
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: combinedPrompt }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400
        }
      })
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      return res.status(200).json({ 
        reply: "🚨 GOOGLE ERROR: " + errorText 
      });
    }

    const data = await googleResponse.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        return res.status(200).json({ reply: "Google returned an empty response." });
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(200).json({ 
      reply: "Server Crash: " + error.message
    });
  }
}
