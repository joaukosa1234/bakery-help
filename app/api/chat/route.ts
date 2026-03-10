export async function GET() {
  return new Response(
    JSON.stringify({
      status: "Lex Auto Help API running",
      version: VERSION,
    }),
    {
      status: 200,
      headers: corsHeaders(),
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message ?? "").trim();

    if (!message) {
      return jsonResponse(400, {
        version: VERSION,
        reply: "Please send a message. (H)",
      });
    }

    const normalizedMessage = normalizeText(message);

    const hardcodedReply = getHardcodedReply(normalizedMessage);
    if (hardcodedReply) {
      return jsonResponse(200, {
        version: VERSION,
        reply: `${hardcodedReply} (H)`,
      });
    }

    const aiReply = await getAiReply(message);

    if (aiReply) {
      return jsonResponse(200, {
        version: VERSION,
        reply: `${aiReply} (A)`,
      });
    }

    return jsonResponse(200, {
      version: VERSION,
      reply:
        "I’m not fully set up for that question yet. Please contact Lex Auto Solutions at 604-303-9020 or sales@lexauto.org. (H)",
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return jsonResponse(500, {
      version: VERSION,
      reply:
        "I’m having trouble answering right now. Please contact Lex Auto Solutions at 604-303-9020 or sales@lexauto.org. (H)",
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

const VERSION = "AI v1.2";

const SHOP = {
  name: "Lex Auto Solutions",
  phone: "604-303-9020",
  email: "sales@lexauto.org",
  address: "5-11220 Voyageur Way, Richmond BC V6X 3E1",
  hours: "Monday to Saturday from 10:00 AM to 6:30 PM. Closed Sunday.",
  diagnosticPrice: "$120",
};

type Intent = {
  name: string;
  reply: string;
  phrases: string[];
  tokens: string[];
  minScore?: number;
};

const INTENTS: Intent[] = [
  {
    name: "hours",
    reply: `${SHOP.name} is open ${SHOP.hours}`,
    phrases: [
      "what are your hours",
      "when are you open",
      "what time are you open",
      "what time do you close",
      "are you open today",
      "shop hours",
      "business hours",
      "when do you open",
      "when do you close",
      "open sunday",
      "closed sunday",
    ],
    tokens: [
      "hours",
      "hour",
      "open",
      "close",
      "closing",
      "opening",
      "time",
      "times",
      "today",
      "sunday",
      "monday",
      "saturday",
    ],
    minScore: 2,
  },
  {
    name: "location",
    reply: `${SHOP.name} is located at ${SHOP.address}.`,
    phrases: [
      "where are you located",
      "what is your address",
      "where is the shop",
      "where are you",
      "shop address",
      "location",
      "directions",
      "richmond address",
    ],
    tokens: [
      "where",
      "location",
      "located",
      "address",
      "directions",
      "richmond",
      "voyageur",
    ],
    minScore: 2,
  },
  {
    name: "phone",
    reply: `You can call ${SHOP.name} at ${SHOP.phone}.`,
    phrases: [
      "what is your phone number",
      "what is your number",
      "can i call you",
      "contact number",
      "telephone number",
      "phone number",
    ],
    tokens: ["phone", "number", "call", "telephone", "tel"],
    minScore: 1,
  },
  {
    name: "email",
    reply: `You can email ${SHOP.name} at ${SHOP.email}.`,
    phrases: [
      "what is your email",
      "can i email you",
      "contact email",
      "email address",
    ],
    tokens: ["email", "mail", "gmail", "e-mail"],
    minScore: 1,
  },
  {
    name: "diagnostic",
    reply: `A diagnostic inspection at ${SHOP.name} is ${SHOP.diagnosticPrice}.`,
    phrases: [
      "how much is a diagnostic",
      "diagnostic price",
      "diagnostic cost",
      "what does a diagnostic cost",
      "check engine light diagnostic",
      "scan price",
      "engine diagnostic price",
    ],
    tokens: [
      "diagnostic",
      "diagnostics",
      "diagnose",
      "diagnosis",
      "scan",
      "scanning",
      "troubleshoot",
      "troubleshooting",
      "check",
      "engine",
      "light",
      "cel",
    ],
    minScore: 2,
  },
  {
    name: "appointment",
    reply: `You can schedule an appointment online or by calling ${SHOP.phone}. Please note the website says requested date and time may need confirmation.`,
    phrases: [
      "book an appointment",
      "schedule an appointment",
      "how do i book",
      "can i book online",
      "make an appointment",
      "schedule service",
      "appointment",
    ],
    tokens: [
      "appointment",
      "book",
      "booking",
      "schedule",
      "scheduled",
      "reserve",
      "quote",
    ],
    minScore: 1,
  },
  {
    name: "after-hours-dropoff",
    reply: `${SHOP.name} offers after-hours drop-off, and the website says you can drop off your vehicle 24/7.`,
    phrases: [
      "after hours drop off",
      "after-hours dropoff",
      "can i drop off after hours",
      "drop off my car after hours",
      "24 7 drop off",
      "dropoff",
    ],
    tokens: ["after", "hours", "drop", "dropoff", "drop-off", "24", "7"],
    minScore: 2,
  },
  {
    name: "warranty",
    reply:
      "Lex Auto Solutions lists a 12-month / 24,000 km nationwide warranty. For manufacturer warranty questions, regular maintenance generally does not need to be done at the dealer as long as it follows the manufacturer schedule and is properly documented.",
    phrases: [
      "do your repairs have a warranty",
      "how long is your warranty",
      "what is your warranty",
      "keep my warranty valid",
      "manufacturer warranty",
      "dealer warranty",
    ],
    tokens: [
      "warranty",
      "warranties",
      "dealer",
      "manufacturer",
      "nationwide",
      "valid",
    ],
    minScore: 1,
  },
  {
    name: "loaner",
    reply: `${SHOP.name} lists courtesy loaner vehicles on the website.`,
    phrases: [
      "do you have loaner cars",
      "do you offer a loaner",
      "can i get a loaner vehicle",
      "courtesy loaner",
    ],
    tokens: ["loaner", "loaners", "car", "vehicle", "courtesy"],
    minScore: 2,
  },
  {
    name: "shuttle",
    reply: `${SHOP.name} lists a courtesy local shuttle service on the website.`,
    phrases: [
      "do you have shuttle service",
      "do you offer a shuttle",
      "courtesy shuttle",
      "local shuttle",
    ],
    tokens: ["shuttle", "courtesy", "local", "ride"],
    minScore: 1,
  },
  {
    name: "roadside",
    reply: `${SHOP.name} lists 24-hour roadside assistance on the website.`,
    phrases: [
      "do you offer roadside assistance",
      "roadside assistance",
      "24 hour roadside assistance",
    ],
    tokens: ["roadside", "assistance", "24", "hour"],
    minScore: 2,
  },
  {
    name: "services-general",
    reply:
      `${SHOP.name} offers general auto repair and maintenance, manufacturer recommended service, preventative maintenance, transmission repair and replacement, brake repair and replacement, A/C repair, tire repair and replacement, fuel system repair, exhaust repair, engine cooling system maintenance, electrical diagnostics, starting and charging repair, wheel alignment, CV axles, computer diagnostic testing, oil changes, tune-ups, brake service, and steering and suspension work.`,
    phrases: [
      "what services do you offer",
      "what do you do",
      "services",
      "do you service cars",
      "what can you repair",
    ],
    tokens: ["services", "service", "repair", "repairs", "offer", "do"],
    minScore: 2,
  },
  {
    name: "brakes",
    reply:
      `${SHOP.name} offers brake repair and replacement, brake jobs, brake service, and brake inspections. Brake fluid should also be changed periodically because it absorbs moisture over time.`,
    phrases: [
      "do you do brakes",
      "brake job",
      "brake service",
      "brake repair",
      "brake inspection",
      "brake fluid",
      "brake flush",
    ],
    tokens: ["brake", "brakes", "fluid", "flush", "inspection"],
    minScore: 1,
  },
  {
    name: "transmission",
    reply: `${SHOP.name} offers transmission repair and replacement and lists transmission services on the website.`,
    phrases: [
      "do you fix transmissions",
      "transmission repair",
      "transmission replacement",
      "transmission service",
    ],
    tokens: ["transmission", "gearbox"],
    minScore: 1,
  },
  {
    name: "ac",
    reply: `${SHOP.name} offers air conditioning A/C repair.`,
    phrases: [
      "do you repair ac",
      "ac repair",
      "air conditioning repair",
      "fix my ac",
    ],
    tokens: ["ac", "a/c", "air", "conditioning"],
    minScore: 2,
  },
  {
    name: "tires",
    reply: `${SHOP.name} offers tire repair and replacement, and the website also includes tire pricing tools.`,
    phrases: [
      "do you do tires",
      "tire repair",
      "tire replacement",
      "tire pricing",
      "new tires",
    ],
    tokens: ["tire", "tires", "wheel"],
    minScore: 1,
  },
  {
    name: "alignment",
    reply: `${SHOP.name} offers wheel alignment services.`,
    phrases: [
      "do you do wheel alignment",
      "alignment service",
      "wheel alignment",
    ],
    tokens: ["alignment", "align", "wheel"],
    minScore: 1,
  },
  {
    name: "oil-change",
    reply: `${SHOP.name} offers oil changes and manufacturer recommended maintenance services.`,
    phrases: [
      "do you do oil changes",
      "oil change",
      "engine oil service",
    ],
    tokens: ["oil", "change", "service"],
    minScore: 2,
  },
  {
    name: "coolant",
    reply:
      `${SHOP.name} offers engine cooling system maintenance and engine cooling system flush and repair. Coolant replacement interval depends on the vehicle, so the owner's manual or a shop inspection is the best guide.`,
    phrases: [
      "do you do coolant service",
      "antifreeze replacement",
      "coolant flush",
      "radiator fluid",
      "cooling system repair",
    ],
    tokens: [
      "coolant",
      "antifreeze",
      "radiator",
      "cooling",
      "flush",
      "overheat",
    ],
    minScore: 1,
  },
  {
    name: "electrical",
    reply: `${SHOP.name} offers electrical diagnostics plus starting and charging repair.`,
    phrases: [
      "electrical diagnostics",
      "starting and charging repair",
      "battery charging issue",
      "alternator issue",
    ],
    tokens: [
      "electrical",
      "starting",
      "charging",
      "battery",
      "alternator",
      "starter",
      "diagnostic",
    ],
    minScore: 2,
  },
  {
    name: "inspection",
    reply: `${SHOP.name} lists computer diagnostic testing, brake inspections, and state emissions inspection / emission repair facility services on the website.`,
    phrases: [
      "do you do inspections",
      "emissions inspection",
      "inspection service",
      "brake inspection",
    ],
    tokens: ["inspection", "inspect", "emission", "emissions"],
    minScore: 1,
  },
  {
    name: "contact",
    reply: `You can contact ${SHOP.name} by phone at ${SHOP.phone}, by email at ${SHOP.email}, or visit the shop at ${SHOP.address}.`,
    phrases: [
      "how do i contact you",
      "how can i reach you",
      "contact info",
      "contact information",
    ],
    tokens: ["contact", "reach", "info", "information"],
    minScore: 1,
  },
];

async function getAiReply(message: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    return null;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bakery-help.vercel.app",
        "X-Title": "Lex Auto Help API",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const rawText = await res.text();

    if (!res.ok) {
      console.error("OpenRouter status:", res.status, rawText);
      return null;
    }

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("OpenRouter parse error:", parseError, rawText);
      return null;
    }

    const reply =
      String(data?.choices?.[0]?.message?.content ?? "").trim() ||
      String(data?.choices?.[0]?.text ?? "").trim() ||
      "";

    if (!reply) {
      return null;
    }

    return sanitizeAiReply(reply);
  } catch (error) {
    console.error("OpenRouter request error:", error);
    return null;
  }
}

function buildSystemPrompt() {
  return `
You are Lex Auto Assistant for Lex Auto Solutions.

Business facts:
- Name: ${SHOP.name}
- Address: ${SHOP.address}
- Phone: ${SHOP.phone}
- Email: ${SHOP.email}
- Hours: ${SHOP.hours}
- Diagnostic inspection price: ${SHOP.diagnosticPrice}
- Appointments can be scheduled online or by phone.
- The website says requested appointment date and time may need confirmation.
- The website says after-hours drop-off is available 24/7.

Services listed on the website:
- General auto repair and maintenance
- Preventative maintenance
- Manufacturer recommended service
- Transmission repair and replacement
- Brake repair and replacement
- Brake service and brake inspections
- Air conditioning A/C repair
- Tire repair and replacement
- Fuel system repair
- Exhaust system repair
- Engine cooling system maintenance
- Engine cooling system flush and repair
- Electrical diagnostics
- Starting and charging repair
- Wheel alignment
- CV axles
- Computer diagnostic testing
- Oil change
- Tune up
- Steering and suspension work
- Emissions inspection and emission repair facility

Benefits listed on the website:
- 12-month / 24,000 km nationwide warranty
- 24-hour roadside assistance
- Courtesy local shuttle service
- Courtesy loaner vehicle
- ASE certified technicians
- RepairPal fair-price estimate positioning

Rules:
- Be concise, helpful, and sound like a service advisor.
- Use the business facts above when the user asks about the shop.
- Do not invent prices except diagnostic inspection price, which is ${SHOP.diagnosticPrice}.
- Do not invent exact turnaround times, part availability, or appointment availability.
- If you are unsure, say so and direct the user to call ${SHOP.phone} or email ${SHOP.email}.
- Do not use markdown bold.
- Do not mention being an AI.
`.trim();
}

function sanitizeAiReply(reply: string) {
  return reply
    .replace(/\s+\(A\)\s*$/i, "")
    .replace(/\s+\(H\)\s*$/i, "")
    .trim();
}

function jsonResponse(
  status: number,
  body: { version: string; reply?: string; status?: string }
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[$]/g, " dollars ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(" ")
    .filter(Boolean);
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getHardcodedReply(message: string): string | null {
  const bestIntent = findBestIntent(message);
  return bestIntent?.reply ?? null;
}

function findBestIntent(message: string): Intent | null {
  let best: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    const score = scoreIntent(message, intent);

    if (score >= (intent.minScore ?? 2)) {
      if (!best || score > best.score) {
        best = { intent, score };
      }
    }
  }

  return best?.intent ?? null;
}

function scoreIntent(message: string, intent: Intent) {
  let score = 0;

  for (const phrase of intent.phrases) {
    if (message.includes(normalizeText(phrase))) {
      score += 6;
    } else {
      const phraseScore = fuzzyPhraseMatch(message, phrase);
      if (phraseScore >= 0.86) score += 5;
      else if (phraseScore >= 0.74) score += 3;
    }
  }

  const messageTokens = tokenize(message);

  for (const token of intent.tokens) {
    if (messageTokens.includes(token)) {
      score += 2;
      continue;
    }

    const fuzzyToken = messageTokens.some(
      (word) => similarity(word, token) >= fuzzyThreshold(token)
    );

    if (fuzzyToken) {
      score += 1;
    }
  }

  if (
    intent.name === "hours" &&
    hasConcept(messageTokens, ["open", "close", "hours", "time"])
  ) {
    score += 2;
  }

  if (
    intent.name === "location" &&
    hasConcept(messageTokens, ["where", "address", "located", "location"])
  ) {
    score += 2;
  }

  if (
    intent.name === "diagnostic" &&
    hasConcept(messageTokens, ["diagnostic", "diagnosis", "scan", "check"]) &&
    hasConcept(messageTokens, ["price", "cost", "much", "how"])
  ) {
    score += 3;
  }

  return score;
}

function fuzzyPhraseMatch(message: string, phrase: string) {
  const msgTokens = tokenize(message);
  const phraseTokens = tokenize(phrase);

  if (msgTokens.length === 0 || phraseTokens.length === 0) return 0;

  let matched = 0;
  for (const phraseToken of phraseTokens) {
    const hit = msgTokens.some(
      (msgToken) => similarity(msgToken, phraseToken) >= fuzzyThreshold(phraseToken)
    );
    if (hit) matched += 1;
  }

  return matched / phraseTokens.length;
}

function hasConcept(messageTokens: string[], targets: string[]) {
  return targets.some((target) =>
    messageTokens.some(
      (token) =>
        token === target || similarity(token, target) >= fuzzyThreshold(target)
    )
  );
}

function fuzzyThreshold(word: string) {
  if (word.length <= 3) return 1;
  if (word.length <= 5) return 0.8;
  return 0.72;
}

function similarity(a: string, b: string) {
  if (a === b) return 1;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}