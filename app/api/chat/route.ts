export async function GET() {
  return new Response(
    JSON.stringify({
      status: "Bakery Help API running",
      version: "AI v1.0",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();

    if (!message) {
      return jsonResponse(400, {
        version: "AI v1.0",
        reply: "Please send a message. (H)",
      });
    }

    const normalizedMessage = normalizeText(message);

    const hardcodedReply = getHardcodedReply(normalizedMessage);
    if (hardcodedReply) {
      return jsonResponse(200, {
        version: "AI v1.0",
        reply: `${hardcodedReply} (H)`,
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse(500, {
        version: "AI v1.0",
        reply:
          "I’m having trouble answering right now. Please contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com. (H)",
      });
    }

    const systemPrompt = `
You are Bakery Assistant for Butter Lane Bake Shop.

Known facts:
- Phone: (604)922-4472
- Email: katie@butterlanebakeshop.com
- Main location: 101-175 W 3rd St North Vancouver
- Main bakery hours:
  Sunday & Monday CLOSED
  Tuesday - Friday 8:30-3:30
  Saturday 10-3
- Lonsdale Quay Market:
  7 days a week 10am-5pm

Rules:
- Answer briefly, clearly, and helpfully.
- If the user asks about hours, location, phone, email, Instagram, pickup, or contact, use the known facts above.
- If you are unsure, say so and direct them to contact the bakery.
- Do not invent pricing, inventory, allergens, menu items, or policies.
- Do not use markdown bold formatting.
- End your response with (A).
`.trim();

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bakery-help.vercel.app",
        "X-Title": "Bakery Help API",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 220,
        temperature: 0.4,
      }),
    });

    const rawText = await aiRes.text();
    console.log("OpenRouter status:", aiRes.status);
    console.log("OpenRouter raw response:", rawText);

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return jsonResponse(502, {
        version: "AI v1.0",
        reply:
          "I’m having trouble answering right now. Please contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com. (H)",
      });
    }

    if (!aiRes.ok) {
      console.error("OpenRouter error parsed:", data);
      return jsonResponse(502, {
        version: "AI v1.0",
        reply:
          "I’m having trouble answering right now. Please contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com. (H)",
      });
    }

    let reply =
      String(data?.choices?.[0]?.message?.content ?? "").trim() ||
      String(data?.choices?.[0]?.text ?? "").trim() ||
      "";

    if (!reply) {
      return jsonResponse(502, {
        version: "AI v1.0",
        reply:
          "I’m having trouble answering right now. Please contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com. (H)",
      });
    }

    if (!reply.endsWith("(A)")) {
      reply = `${reply} (A)`;
    }

    return jsonResponse(200, {
      version: "AI v1.0",
      reply,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return jsonResponse(500, {
      version: "AI v1.0",
      reply:
        "I’m having trouble answering right now. Please contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com. (H)",
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

function jsonResponse(status: number, body: { version: string; reply?: string; status?: string }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getHardcodedReply(message: string): string | null {
  const asksHours =
    hasAny(message, [
      "hours",
      "hour",
      "open",
      "close",
      "closing",
      "opening",
      "time",
      "times",
      "store hours",
      "shop hours",
      "today",
    ]) &&
    !hasAny(message, ["phone", "number"]);

  if (asksHours) {
    return "Our main bakery at 101-175 W 3rd St, North Vancouver is closed Sunday and Monday, open Tuesday to Friday from 8:30 AM to 3:30 PM, and Saturday from 10 AM to 3 PM. We also have a stall at Lonsdale Quay Market open 7 days a week from 10 AM to 5 PM.";
  }

  const asksPhone = hasAny(message, [
    "phone",
    "number",
    "call",
    "contact number",
    "telephone",
    "tel",
  ]);

  if (asksPhone) {
    return "You can call Butter Lane Bake Shop at (604)922-4472.";
  }

  const asksEmail = hasAny(message, [
    "email",
    "mail",
    "e mail",
    "gmail",
    "contact email",
  ]);

  if (asksEmail) {
    return "You can email the bakery at katie@butterlanebakeshop.com.";
  }

  const asksInstagram = hasAny(message, [
    "instagram",
    "insta",
    "ig",
    "social",
    "dm",
    "message on instagram",
  ]);

  if (asksInstagram) {
    return "You can connect with the bakery on Instagram at @ButterLaneBakeShop.";
  }

  const asksLocation = hasAny(message, [
    "where",
    "location",
    "located",
    "address",
    "where are you",
    "where is the shop",
    "where is the bakery",
    "north vancouver",
    "lonsdale quay",
  ]);

  if (asksLocation) {
    return "Butter Lane Bake Shop is located at 101-175 W 3rd St, North Vancouver. They also have a stall at Lonsdale Quay Market.";
  }

  const asksGlutenFree = hasAny(message, [
    "gluten",
    "guten",
    "glut",
    "gluteen",
    "glutten",
    "celiac",
    "celiac friendly",
    "gluten free",
    "guten free",
    "glutenfree",
  ]);

  if (asksGlutenFree) {
    return "I’m not sure about current gluten-free options. Please contact the bakery directly at katie@butterlanebakeshop.com or call (604)922-4472 for the most up-to-date information.";
  }

  const asksPickup = hasAny(message, [
    "pickup",
    "pick up",
    "collect",
    "order pickup",
    "pick it up",
  ]);

  if (asksPickup) {
    return "For pickup questions, it’s best to contact the bakery directly at (604)922-4472 or katie@butterlanebakeshop.com.";
  }

  const asksCustomOrders = hasAny(message, [
    "custom cake",
    "custom order",
    "birthday cake",
    "cake order",
    "special order",
    "wedding cake",
    "event order",
  ]);

  if (asksCustomOrders) {
    return "For custom cake or special order questions, please contact the bakery directly at katie@butterlanebakeshop.com or call (604)922-4472.";
  }

  const asksGeneralContact =
    hasAny(message, ["contact", "reach you", "reach us", "how do i contact"]) &&
    !hasAny(message, ["phone", "email", "instagram"]);

  if (asksGeneralContact) {
    return "You can contact Butter Lane Bake Shop by phone at (604)922-4472, by email at katie@butterlanebakeshop.com, or on Instagram at @ButterLaneBakeShop.";
  }

  return null;
}