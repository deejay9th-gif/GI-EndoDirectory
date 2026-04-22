export const config = {
  runtime: 'edge', // Keep the Edge network for speed
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { text, systemPrompt } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing prompt text' }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // Using Flash-8B: The fastest model for large context
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

    // Direct REST API call (Bypasses the buggy SDK on Vercel Edge)
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
          { parts: [{ text: text }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 250 // Force the AI to be concise and finish generating quickly
        }
      })
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google API Error:", errorText);
      throw new Error("Google API returned a non-200 status");
    }

    const data = await googleResponse.json();
    const aiText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: aiText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Direct Fetch Error:", error);
    return new Response(
      JSON.stringify({ reply: "My connection to the server was interrupted! Let's try that again." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
