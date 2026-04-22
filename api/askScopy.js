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
    
    // Check if Vercel is failing to inject the environment variable
    if (!apiKey) {
        return new Response(
            JSON.stringify({ reply: "Diagnostic Error: Vercel cannot find the GEMINI_API_KEY environment variable." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

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
          { role: "user", parts: [{ text: text }] } // Explicitly define the role
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 250 
        }
      })
    });

    // If Google rejects the request, send the EXACT error to the chat UI
    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      return new Response(
        JSON.stringify({ reply: `Google API Rejected Request (${googleResponse.status}): ${errorText.substring(0, 300)}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await googleResponse.json();
    
    // Check if Google's safety filters blocked the response
    if (!data.candidates || data.candidates.length === 0) {
        return new Response(
            JSON.stringify({ reply: "Diagnostic Error: Google returned an empty response. It may have triggered a safety filter." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: aiText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // If the code crashes entirely, send the stack trace
    return new Response(
      JSON.stringify({ reply: `Code Crash: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
