// Look ma, no imports! We completely removed the buggy @google/generative-ai SDK.

export default async function handler(req, res) {
  // 1. Ensure POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Parse Body safely
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { text, systemPrompt } = body;

    if (!text) {
      return res.status(400).json({ reply: 'Error: Prompt text is missing.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ reply: 'Error: GEMINI_API_KEY is missing in Vercel.' });
    }

    // 3. Native Fetch to Google REST API (Bypassing the NPM package entirely)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
          maxOutputTokens: 400 // Capped to ensure lightning-fast responses
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
    
    // Safety net in case Google sends back an empty response
    if (!data.candidates || data.candidates.length === 0) {
        return res.status(500).json({ reply: "Google returned an empty response (possible safety filter trigger)." });
    }

    // Extract the AI text
    const aiText = data.candidates[0].content.parts[0].text;

    // 4. Return successful response
    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Native Fetch Crash:", error);
    return res.status(500).json({ 
      reply: `Server Crash: ${error.message}` 
    });
  }
}
