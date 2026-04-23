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

    // THE MAGIC FIX: .trim() strips away any accidental invisible spaces or newlines
    const apiKey = process.env.GEMINI_API_KEY.trim(); 
    
    // Explicitly calling the standard flash model
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
      const errorText = await googleResponse.text();
      console.error("Google API Error:", errorText);
      return res.status(500).json({ 
        reply: `Google API Error (${googleResponse.status}): ${errorText.substring(0, 150)}` 
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
      reply: `Server Crash: ${error.message}` 
    });
  }
}
