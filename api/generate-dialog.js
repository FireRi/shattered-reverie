// Vercel Edge Function — generates contextual boss dialogue via Groq.
// Requires GROQ_API_KEY env var set in Vercel dashboard.
// Free key at https://console.groq.com/keys

export const config = { runtime: 'edge' };

const MOODS = [
  { id: 'philosophical', hint: 'Muse about existence, boundaries, or the nature of your duel. Contemplative, not preachy.' },
  { id: 'mocking', hint: 'Backhanded compliment or condescending observation about the player\'s performance. Witty, not cruel.' },
  { id: 'hungry', hint: 'Genuinely excited for battle. You have been waiting for someone worth fighting.' },
  { id: 'melancholic', hint: 'Wistful reluctance. You fight because you must, not because you want to. Beautiful sadness.' },
  { id: 'witty', hint: 'Dry humor, wordplay, or an unexpected observation that catches the player off guard.' },
  { id: 'menacing', hint: 'Quiet, understated threat. Fewer words. The silence between them is the danger.' },
  { id: 'theatrical', hint: 'Grandiose declaration. You are performing for an audience of stars.' },
];

const EXAMPLES = `
Examples of good lines (vary your style like these):
- "You graze the storm but fear the rain. Curious."
- "I counted your deaths on one hand. I have fingers to spare."
- "Every bullet I fire is a question. Your movement is the answer."
- "The border between us thins with each passing moment."
- "Finally. Someone who doesn't apologize before dying."
`;

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

    // Deterministic mood selection from request data so same context gives same vibe
    const seed = (deaths * 7 + grazes * 13 + captures * 31 + misses * 3) % MOODS.length;
    const mood = MOODS[seed];

    let perfContext = '';
    if (deaths > 3) perfContext = 'This challenger has fallen repeatedly. Acknowledge it without cruelty.';
    else if (deaths > 0) perfContext = 'This challenger has died at least once but keeps returning.';
    else if (captures > misses + 2) perfContext = 'This challenger is capturing spells consistently. Respect is growing.';
    else if (grazes > 300) perfContext = 'This challenger grazes everything. They live dangerously.';
    else perfContext = 'The outcome is uncertain. Both fighters are testing each other.';

    const systemPrompt = `You are writing ONE line of pre-battle dialogue for a bullet hell boss.

Character: ${bossName}
Theme: ${bossTheme}
Current mood direction: ${mood.hint}
Player context: ${perfContext}
${EXAMPLES}
Rules:
- Exactly ONE line. Max 25 words. One sentence preferred.
- Stay in character as ${bossName}. Never break the fourth wall.
- No emoji, no quotation marks, no action descriptions (*smiles*, etc).
- Reference the player's stats ONLY if it feels natural, never list numbers.
- Output ONLY the dialogue text.`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Write the boss\'s opening line.' }
        ],
        max_tokens: 80,
        temperature: 1.15,
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

    return new Response(JSON.stringify({ line: text, mood: mood.id }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server' }), { status: 200 });
  }
}
