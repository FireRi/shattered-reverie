export const config = { runtime: 'edge' };

const _rate = new Map();
function limited(ip) {
  const now = Date.now();
  const e = _rate.get(ip) || { n: 0, t: now };
  if (now - e.t > 60000) { e.n = 0; e.t = now; }
  e.n++; _rate.set(ip, e);
  return e.n > 20;
}
function safeStr(v, max) {
  return String(v || '').replace(/[<>&\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim().substring(0, max);
}
function safeInt(v, min, max) {
  return Math.max(min, Math.min(max, parseInt(v) || 0));
}
function clipLine(v, max) {
  return safeStr(v, max).replace(/^(boss|suzuran|player)\s*:\s*/i, '').replace(/^["'“”]+|["'“”]+$/g, '').trim();
}
function parseJson(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch (e) { return null; }
}
function normalizeLines(value) {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const who = ['b', 'p', 'b', 'p'];
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const item = value[i];
    const text = clipLine(typeof item === 'string' ? item : item && item.text, 160);
    if (!text) return null;
    lines.push({ who: who[i], text });
  }
  return lines;
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
    const bossName = safeStr(body.bossName, 40) || 'The guardian';
    const bossVoice = safeStr(body.bossVoice, 120) || 'proud boundary guardian; dry and dangerous';
    const bossTheme = safeStr(body.bossTheme, 140) || 'an unspoken signature spell';
    const stage = safeStr(body.stage, 40) || 'a fractured boundary';
    const stageMode = safeStr(body.stageMode, 24) || 'standard';
    const difficulty = safeStr(body.difficulty, 20) || 'Normal';
    const mode = safeStr(body.mode, 20) || 'route';
    const playerName = safeStr(body.playerName, 24) || 'Suzuran';
    const deaths = safeInt(body.deaths, 0, 999);
    const grazes = safeInt(body.grazes, 0, 99999);
    const captures = safeInt(body.captures, 0, 999);
    const misses = safeInt(body.misses, 0, 999);
    const streak = safeInt(body.streak, 0, 99);

    const seed = (deaths * 7 + grazes * 13 + captures * 31 + misses * 3 + streak * 17) % MOODS.length;
    const mood = MOODS[seed];

    let perfContext = 'The outcome is uncertain. Both fighters are still measuring each other.';
    if (deaths > 3) perfContext = `${playerName} has died repeatedly and keeps returning. The boss has noticed, and is either grudgingly impressed or deeply annoyed.`;
    else if (deaths > 0) perfContext = `${playerName} has fallen at least once but came back. The boss may treat that as stubbornness, respect, or a joke.`;
    else if (captures > misses + 2 && captures > 0) perfContext = `${playerName} has been capturing spell cards with unsettling consistency. The boss is starting to take this personally.`;
    else if (grazes > 300) perfContext = `${playerName} grazes everything and lives close to the edge. The boss has noticed the recklessness and may needle her about it.`;
    else if (streak >= 2) perfContext = `${playerName} is on a capture streak. The boss is aware the audience is enjoying it.`;
    else if (misses > captures + 2) perfContext = `${playerName} has been struggling with spell cards, but refuses to slow down. The boss may be unimpressed or unexpectedly patient.`;

    const systemPrompt = `You write pre-battle banter for a vertical bullet-hell game. The boss is ${bossName}. Boss voice: ${bossVoice}. Signature spell or theme: ${bossTheme}. Stage: ${stage} (${stageMode}); difficulty: ${difficulty}; run mode: ${mode}. Mood direction: ${mood.hint}

The player is ${playerName}, a calm boundary traveler with dry wit. She is not a generic hero, not a chosen one, and not impressed by titles.
Run context: ${perfContext}

Write EXACTLY four lines, alternating boss, player, boss, player.
1. The boss opens with a challenge built from one concrete image in their theme or the stage.
2. ${playerName} answers the boss directly and turns that image against them.
3. The boss responds to what she actually said, then raises the personal stake or threat.
4. ${playerName} closes with a retort that lands the exchange.

Rules:
- 8 to 28 words per line. Never exceed 160 characters.
- Every line must answer the previous line. No isolated slogans.
- Keep the boss's voice specific: ${bossVoice}.
- ${playerName} is dry, observant, and playful. Never cruel, never boastful, never a generic action hero.
- Let the boss be funny, petty, grand, tired, or unsettling. Characters may be wrong about each other.
- Use concrete nouns, not vague grandeur.
- No fourth-wall jokes, emoji, action descriptions, quotation marks, or speaker labels.
- Never use these exhausted phrases: little spark, dance for me, amusing, fragile, fate, destiny, worthy opponent, this reverie, save the speech, talk less, dodge more, keep up if you can, I was about to say the same.
- Do not mention the player's numeric stats. If performance matters, imply it through attitude.
- Vary rhythm. Short lines are allowed. Do not rhyme.
${EXAMPLES}
Return ONLY JSON in this shape:
{"lines":[{"who":"b","text":"..."},{"who":"p","text":"..."},{"who":"b","text":"..."},{"who":"p","text":"..."}]}`;

    async function callGroq(model, jsonMode) {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Write the four-line exchange now.' }
          ],
          max_tokens: 520,
          temperature: 1.08,
          top_p: 0.95,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
        }),
      });
    }

    const preferred = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const models = [preferred, 'llama-3.1-8b-instant'].filter((m, i, a) => m && a.indexOf(m) === i);
    let result = null;

    for (const model of models) {
      let groqRes = await callGroq(model, true);
      if (!groqRes.ok) groqRes = await callGroq(model, false);
      if (!groqRes.ok) continue;
      const data = await groqRes.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) continue;
      const parsed = parseJson(raw);
      const lines = normalizeLines(parsed && parsed.lines);
      if (lines) {
        result = { lines, mood: mood.id, model };
        break;
      }
    }

    if (!result) {
      return new Response(JSON.stringify({ error: 'generation' }), { status: 200 });
    }
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server' }), { status: 200 });
  }
}

const MOODS = [
  { id: 'philosophical', hint: 'Muse about existence, boundaries, or the strange rules of this duel. Contemplative, not preachy.' },
  { id: 'mocking', hint: 'A backhanded compliment or condescending observation about the player. Witty, not cruel.' },
  { id: 'hungry', hint: 'Genuinely excited for battle. You have waited a long time for someone worth fighting.' },
  { id: 'melancholic', hint: 'Wistful reluctance. You fight because you must, not because you want to. Beautiful sadness.' },
  { id: 'witty', hint: 'Dry humor, wordplay, or an unexpected observation that catches the player off guard.' },
  { id: 'menacing', hint: 'Quiet, understated threat. Fewer words. The silence between them is the danger.' },
  { id: 'theatrical', hint: 'Grandiose declaration. You are performing for an audience of stars, and you know it.' },
];

const EXAMPLES = `
Examples of the rhythm and specificity to aim for (do not reuse these images):
- "You brought an entire sky to a knife fight. I almost respect the excess."
- "You cut the clouds. I brought a better sky."
- "My scars have names. Yours are about to."
- "Then write neatly. I only sign once."
`;
