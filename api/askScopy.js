export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { text, systemPrompt } = body;

    if (!text) {
      return res.status(400).json({ reply: 'Error: Prompt text is missing.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'Error: GEMINI_API_KEY is missing in Vercel.' });
    }

    // Clean the key
    const apiKey = process.env.GEMINI_API_KEY.trim(); 
    
    // OLD-SCHOOL URL CONSTRUCTION: No ${} variables that can get accidentally erased!
    // Using the official "v1" stable endpoint
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey;

    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: "user", parts: [{ text: text }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400
        }
      })
    });

    if (!googleResponse.ok) {
      // I removed the substring limit so we can see the full, exact error from Google
      const errorText = await googleResponse.text();
      return res.status(500).json({ 
        reply: "Google API Error (" + googleResponse.status + "): " + errorText 
      });
    }

    const data = await googleResponse.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        return res.status(500).json({ reply: "Google returned an empty response." });
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(500).json({ 
      reply: "Server Crash: " + error.message
    });
  }
}
