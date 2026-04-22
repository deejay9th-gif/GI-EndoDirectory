import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Force Vercel to use the Edge network (bypasses 10s timeout)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 2. Edge functions only allow POST requests for payloads
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Extract the payload using Web API methods
    const { text, systemPrompt } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing prompt text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Initialize Gemini (Ensure your Vercel Environment Variables contain GEMINI_API_KEY)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Using flash for maximum speed
      systemInstruction: systemPrompt,
    });

    // 5. Fetch the response
    const result = await model.generateContent(text);
    const response = await result.response;
    const aiText = response.text();

    // 6. Return standard Web Response
    return new Response(JSON.stringify({ reply: aiText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Scopy Edge Error:", error);

    // 7. Handle Google API timeouts or specific errors gracefully
    if (error.message && error.message.includes('fetch')) {
      return new Response(
        JSON.stringify({ reply: "I'm thinking a bit too hard! My connection timed out. Could you try asking that in a slightly shorter way?" }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ reply: `Backend Error: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
