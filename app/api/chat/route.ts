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

const VERSION = "AI v1.3";

const SHOP = {
  name: "Lex Auto Solutions",
  phone: "604-303-9020",
  email: "sales@lexauto.org",
  address: "5-11220 Voyageur Way, Richmond BC V6X 3E1",
  hours: "Monday to Saturday from 10:00 AM to 6:30 PM. Closed Sunday.",
  diagnosticPrice: "$120",
};

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
        "HTTP-Referer": "https://lexauto-chat.vercel.app",
        "X-Title": "Lex Auto Help API",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content: `
You are Lex Auto Assistant for Lex Auto Solutions.

Known business facts:
- Address: ${SHOP.address}
- Phone: ${SHOP.phone}
- Email: ${SHOP.email}
- Hours: ${SHOP.hours}
- Diagnostic inspection price: ${SHOP.diagnosticPrice}
- After-hours drop-off is available 24/7.
- The website lists a 12-month / 24,000 km nationwide warranty.
- The website lists 24-hour roadside assistance, courtesy local shuttle service, and courtesy loaner vehicle.
- Services listed include preventative maintenance, brake repair and replacement, transmission repair and replacement, A/C repair, tire repair and replacement, fuel system repair, exhaust repair, engine cooling system maintenance, electrical diagnostics, starting and charging repair, wheel alignment, computer diagnostics, oil changes, tune-ups, and steering/suspension work.

Rules:
- Be short and direct.
- Prefer answers like "Yes, we do that."
- Do not invent prices except diagnostic inspection price.
- Do not invent exact availability or turnaround times.
- If unsure, direct the customer to call ${SHOP.phone} or email ${SHOP.email}.
- Do not use markdown bold.
            `.trim(),
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

    const data = JSON.parse(rawText);
    const reply =
      String(data?.choices?.[0]?.message?.content ?? "").trim() ||
      String(data?.choices?.[0]?.text ?? "").trim() ||
      "";

    if (!reply) return null;

    return reply.replace(/\s+\((A|H)\)\s*$/i, "").trim();
  } catch (error) {
    console.error("OpenRouter request error:", error);
    return null;
  }
}

function getHardcodedReply(message: string): string | null {
  // hours
  if (matches(message, [
    "what are your hours",
    "when are you open",
    "when r u open",
    "wen are you open",
    "what time do you open",
    "what time do you close",
    "are you open today",
    "are you open sunday",
    "shop hours",
    "business hours",
  ], [
    "hours", "hour", "open", "close", "today", "sunday", "time", "times"
  ])) {
    return `${SHOP.name} is open ${SHOP.hours}`;
  }

  // location
  if (matches(message, [
    "where are you located",
    "where are you",
    "what is your address",
    "shop address",
    "where is the shop",
    "richmond address",
    "adress",
  ], [
    "where", "location", "located", "address", "richmond", "voyageur"
  ])) {
    return `${SHOP.name} is located at ${SHOP.address}.`;
  }

  // phone
  if (matches(message, [
    "what is your phone number",
    "what is your number",
    "can i call you",
    "contact number",
    "telephone number",
  ], [
    "phone", "number", "call", "telephone", "tel"
  ])) {
    return `You can call ${SHOP.name} at ${SHOP.phone}.`;
  }

  // email
  if (matches(message, [
    "what is your email",
    "can i email you",
    "contact email",
    "email address",
  ], [
    "email", "mail", "e mail"
  ])) {
    return `You can email ${SHOP.name} at ${SHOP.email}.`;
  }

  // appointment
  if (matches(message, [
    "book an appointment",
    "schedule an appointment",
    "can i book online",
    "how do i book",
    "make an appointment",
    "schedule service",
  ], [
    "appointment", "book", "booking", "schedule", "reserve"
  ])) {
    return `You can schedule an appointment online or by calling ${SHOP.phone}.`;
  }

  // diagnostic price
  if (matches(message, [
    "how much is a diagnostic",
    "diagnostic cost",
    "diagnostic price",
    "check engine diagnostic price",
    "how much is diagnosis",
    "diagnotic",
    "diagnositc",
  ], [
    "diagnostic", "diagnostics", "diagnosis", "scan", "check engine", "cel"
  ])) {
    return `A diagnostic inspection at ${SHOP.name} is ${SHOP.diagnosticPrice}.`;
  }

  // cooling / coolant
  if (matches(message, [
    "do you do coolant fixes",
    "do you fix coolant leaks",
    "coolant leak",
    "coolent leak",
    "cooling system repair",
    "radiator repair",
    "overheating problem",
    "antifreeze issue",
    "water pump problem",
    "thermostat issue",
  ], [
    "coolant", "coolent", "cooling", "radiator", "overheat", "overheating",
    "antifreeze", "water pump", "thermostat"
  ])) {
    return "Yes, we do cooling system repairs including coolant leaks, radiator issues, overheating problems, and related cooling system service.";
  }

  // brakes
  if (matches(message, [
    "do you do brakes",
    "brake job",
    "brake repair",
    "brake service",
    "brake inspection",
    "brake fluid flush",
    "brake flush",
  ], [
    "brake", "brakes", "pads", "rotors", "caliper", "brake fluid", "flush"
  ])) {
    return "Yes, we do brake repair, brake service, brake inspections, and brake fluid service.";
  }

  // oil changes
  if (matches(message, [
    "do you do oil changes",
    "oil change",
    "engine oil service",
  ], [
    "oil", "change", "oil change"
  ])) {
    return "Yes, we do oil changes and manufacturer recommended maintenance.";
  }

  // transmission
  if (matches(message, [
    "do you fix transmissions",
    "transmission repair",
    "transmission replacement",
    "transmission service",
    "gearbox repair",
  ], [
    "transmission", "gearbox"
  ])) {
    return "Yes, we do transmission repair and replacement.";
  }

  // air conditioning
  if (matches(message, [
    "do you repair ac",
    "ac repair",
    "air conditioning repair",
    "fix my ac",
    "a c repair",
    "a/c repair",
  ], [
    "ac", "a/c", "air conditioning", "conditioning"
  ])) {
    return "Yes, we do air conditioning repair.";
  }

  // tires
  if (matches(message, [
    "do you do tires",
    "tire repair",
    "tire replacement",
    "new tires",
    "flat tire repair",
  ], [
    "tire", "tires"
  ])) {
    return "Yes, we do tire repair and tire replacement.";
  }

  // alignment
  if (matches(message, [
    "do you do alignment",
    "wheel alignment",
    "alignment service",
    "car alignment",
  ], [
    "alignment", "align", "wheel"
  ])) {
    return "Yes, we do wheel alignment service.";
  }

  // batteries / charging
  if (matches(message, [
    "do you do batteries",
    "battery replacement",
    "battery issue",
    "alternator issue",
    "starter issue",
    "charging problem",
  ], [
    "battery", "batteries", "alternator", "starter", "charging"
  ])) {
    return "Yes, we do battery-related diagnostics plus starting and charging system repair.";
  }

  // suspension / steering
  if (matches(message, [
    "do you do suspension",
    "steering repair",
    "suspension repair",
    "front end issue",
  ], [
    "steering", "suspension", "front end"
  ])) {
    return "Yes, we do steering and suspension work.";
  }

  // exhaust
  if (matches(message, [
    "do you fix exhaust",
    "exhaust repair",
    "muffler repair",
  ], [
    "exhaust", "muffler"
  ])) {
    return "Yes, we do exhaust system repair.";
  }

  // fuel system
  if (matches(message, [
    "do you fix fuel system",
    "fuel system repair",
    "fuel cleaning",
    "injector cleaning",
  ], [
    "fuel", "injector", "cleaning"
  ])) {
    return "Yes, we do fuel system repair and fuel system cleaning services.";
  }

  // warranty
  if (matches(message, [
    "do your repairs have a warranty",
    "how long is your warranty",
    "what is your warranty",
    "repair warranty",
  ], [
    "warranty", "nationwide"
  ])) {
    return "We offer a 12-month / 24,000 km nationwide warranty on qualifying repairs and services.";
  }

  // roadside
  if (matches(message, [
    "do you offer roadside assistance",
    "roadside assistance",
    "24 hour roadside assistance",
  ], [
    "roadside", "assistance"
  ])) {
    return "Yes, we offer 24-hour roadside assistance.";
  }

  // shuttle
  if (matches(message, [
    "do you have shuttle service",
    "shuttle service",
    "courtesy shuttle",
  ], [
    "shuttle", "courtesy shuttle"
  ])) {
    return "Yes, we offer a courtesy local shuttle service.";
  }

  // loaner
  if (matches(message, [
    "do you have loaner cars",
    "loaner car",
    "courtesy loaner",
    "loaner vehicle",
  ], [
    "loaner", "courtesy loaner"
  ])) {
    return "Yes, we offer a courtesy loaner vehicle.";
  }

  // after-hours dropoff
  if (matches(message, [
    "can i drop off after hours",
    "after hours drop off",
    "after-hours drop off",
    "24 7 drop off",
    "drop off my car tonight",
  ], [
    "after hours", "drop off", "dropoff", "24/7"
  ])) {
    return "Yes, we offer after-hours drop-off, and the website says you can drop off your vehicle 24/7.";
  }

  // inspections / emissions
  if (matches(message, [
    "do you do inspections",
    "emissions inspection",
    "brake inspection",
    "inspection service",
  ], [
    "inspection", "inspect", "emissions", "emission"
  ])) {
    return "Yes, we do inspections, including brake inspections, and the website also lists emissions inspection and emission repair services.";
  }

  // general contact
  if (matches(message, [
    "how do i contact you",
    "how can i reach you",
    "contact info",
    "contact information",
  ], [
    "contact", "reach", "info", "information"
  ])) {
    return `You can contact ${SHOP.name} by phone at ${SHOP.phone}, by email at ${SHOP.email}, or visit us at ${SHOP.address}.`;
  }

  // broad services question
  if (matches(message, [
    "what services do you offer",
    "what do you do",
    "what can you fix",
    "what do you repair",
  ], [
    "services", "service", "repair", "repairs", "offer"
  ])) {
    return "We do general auto repair and maintenance, brakes, transmission work, A/C repair, tire service, fuel system repair, exhaust work, cooling system service, electrical diagnostics, starting and charging repair, wheel alignment, oil changes, tune-ups, and steering and suspension work.";
  }

  return null;
}

function matches(message: string, phrases: string[], keywords: string[]) {
  for (const phrase of phrases) {
    if (message.includes(normalizeText(phrase))) return true;
    if (fuzzyPhraseMatch(message, phrase) >= 0.82) return true;
  }

  let hits = 0;
  for (const keyword of keywords) {
    if (hasKeyword(message, keyword)) hits += 1;
  }

  return hits >= 1;
}

function hasKeyword(message: string, keyword: string) {
  const tokens = tokenize(message);
  const targetTokens = tokenize(keyword);

  return targetTokens.every((target) =>
    tokens.some((token) => similarity(token, target) >= fuzzyThreshold(target))
  );
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text).split(" ").filter(Boolean);
}

function fuzzyPhraseMatch(message: string, phrase: string) {
  const msgTokens = tokenize(message);
  const phraseTokens = tokenize(phrase);
  if (!msgTokens.length || !phraseTokens.length) return 0;

  let matched = 0;
  for (const phraseToken of phraseTokens) {
    const hit = msgTokens.some(
      (msgToken) => similarity(msgToken, phraseToken) >= fuzzyThreshold(phraseToken)
    );
    if (hit) matched += 1;
  }

  return matched / phraseTokens.length;
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