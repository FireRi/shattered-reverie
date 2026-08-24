// Vercel Edge Function — generates contextual boss dialogue via Groq.
// Requires GROQ_API_KEY env var set in Vercel dashboard.
// Free key at https://console.groq.com/keys

export const config = { runtime: 'edge' };

const _rate = new Map();
function limited(ip) {
  const now = Date.now();
  const e = _rate.get(ip) || { n: 0, t: now };
  if (now - e.t > 60000) { e.n = 0; e.t = now; }
  e.n++; _rate.set(ip, e);
  return e.n > 12;
}
function safeStr(v, max) {
  return String(v || '').replace(/[<>&"'\x00-\x1f\x7f]/g, '').trim().substring(0, max);
}
function safeInt(v, min, max) {
  return Math.max(min, Math.min(max, parseInt(v) || 0));
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (limited(ip)) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'no_key' }), { status: 200 });
  }

  try {
    const body = await req.json();
    const bossName = safeStr(body.bossName, 40);
    const bossTheme = safeStr(body.bossTheme, 60);
    const deaths = safeInt(body.deaths, 0, 999);
    const grazes = safeInt(body.grazes, 0, 99999);
    const captures = safeInt(body.captures, 0, 999);
    const misses = safeInt(body.misses, 0, 999);

    const seed = (deaths * 7 + grazes * 13 + captures * 31 + misses * 3) % MOODS.length;
    const mood = MOODS[seed];

    let perfContext = '';
    if (deaths > 3) perfContext = 'This challenger has fallen repeatedly. Acknowledge it without cruelty.';
    else if (deaths > 0) perfContext = 'This challenger has died at least once but keeps returning.';
    else if (captures > misses + 2) perfContext = 'This challenger is capturing spells consistently. Respect is growing.';
    else if (grazes > 300) perfContext = 'This challenger grazes everything. They live dangerously.';
    else perfContext = 'The outcome is uncertain. Both fighters are testing each other.';

    const systemPrompt = `You are writing ONE line of pre-battle dialogue for a bullet hell boss.\n\nCharacter: ${bossName}\nTheme: ${bossTheme}\nCurrent mood direction: ${mood.hint}\nPlayer context: ${perfContext}\n${EXAMPLES}\nRules:\n- Exactly ONE line. Max 25 words. One sentence preferred.\n- Stay in character as ${bossName}. Never break the fourth wall.\n- No emoji, no quotation marks, no action descriptions.\n- Reference the player's stats ONLY if it feels natural, never list numbers.\n- Output ONLY the dialogue text.`;

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
          { role: 'user', content: "Write the boss's opening line." }
        ],
        max_tokens: 80,
        temperature: 1.15,
      }),
    });

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: 'groq_error' }), { status: 200 });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return new Response(JSON.stringify({ error: 'empty' }), { status: 200 });
    }

    const text = safeStr(raw, 200);
    return new Response(JSON.stringify({ line: text, mood: mood.id }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server' }), { status: 200 });
  }
}

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
- "Finally. Someone who doesn't apologize before dying.";
`;
