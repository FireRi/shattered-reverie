// Vercel Edge Function — generates contextual boss dialogue via Groq.
// Requires GROQ_API_KEY env var set in Vercel dashboard.
// Free key at https://console.groq.com/keys

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'no_key' }), { status: 200 });
  }

  try {
    const body = await req.json();
    const { bossName, bossTheme, deaths, grazes, captures, misses } = body;

    const perfNote = deaths > 2
      ? 'The player has died many times. The boss is amused but slightly bored.'
      : captures > misses
        ? 'The player is doing well. The boss is impressed but hiding it.'
        : 'The fight is evenly matched so far.';

    const prompt = `You write one taunting pre-battle line for a bullet hell boss character.
Boss name: ${bossName}
Boss personality/theme: ${bossTheme}
Context: ${perfNote}
Player stats: ${grazes} grazes, ${captures} spell captures, ${deaths} deaths, ${misses} timeouts.

Rules:
- Exactly ONE line of dialogue, max 25 words.
- Confident, slightly menacing, poetic. No emoji. No quotation marks.
- Reference the player's performance subtly if relevant.
- Output ONLY the dialogue text, nothing else.`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.9,
      }),
    });

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: 'groq_error' }), { status: 200 });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return new Response(JSON.stringify({ error: 'empty' }), { status: 200 });
    }

    return new Response(JSON.stringify({ line: text }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server' }), { status: 200 });
  }
}
