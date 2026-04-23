export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Sending a 200 status so the frontend doesn't chop the message!
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
    
    // Using v1beta for maximum compatibility
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

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
      // THE TROJAN HORSE: We return a 200 status so your frontend prints the whole thing!
      return res.status(200).json({ 
        reply: "🚨 FULL GOOGLE ERROR: " + errorText 
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
