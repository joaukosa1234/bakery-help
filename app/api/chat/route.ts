export async function GET() {
  return new Response(
    JSON.stringify({
      status: "Lex Auto Help API running",
      version: "AI v1.1",
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
        version: "AI v1.1",
        reply: "Please send a message. (H)",
      });
    }

    const normalizedMessage = normalizeText(message);

    const hardcodedReply = getHardcodedReply(normalizedMessage);
    if (hardcodedReply) {
      return jsonResponse(200, {
        version: "AI v1.1",
        reply: `${hardcodedReply} (H)`,
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse(500, {
        version: "AI v1.1",
        reply:
          "I’m having trouble answering right now. Please contact Lex Auto Solutions directly at 604-303-9020 or sales@lexauto.org. (H)",
      });
    }

    const systemPrompt = `
You are Lex Auto Assistant for Lex Auto Solutions.

Known facts:
- Phone: 604-303-9020
- Email: sales@lexauto.org
- Address: 5-11220 Voyageur Way, Richmond BC V6X 3E1
- Hours:
  Monday-Saturday 10:00 AM - 6:30 PM
  Sunday Closed

Rules:
- Answer briefly, clearly, and helpfully.
- If the user asks about hours, location, phone, email, contact, appointments, or general shop questions, use the known facts above.
- If you are unsure, say so and direct them to contact the shop.
- Do not invent pricing, repair estimates, inventory, warranty coverage, or services not confirmed.
- Do not use markdown bold formatting.
- End every response with (A).
`.trim();

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bakery-nine-jet.vercel.app",
        "X-Title": "Lex Auto Help API",
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
        version: "AI v1.1",
        reply:
          "I’m having trouble answering right now. Please contact Lex Auto Solutions directly at 604-303-9020 or sales@lexauto.org. (H)",
      });
    }

    if (!aiRes.ok) {
      console.error("OpenRouter error parsed:", data);
      return jsonResponse(502, {
        version: "AI v1.1",
        reply:
          "I’m having trouble answering right now. Please contact Lex Auto Solutions directly at 604-303-9020 or sales@lexauto.org. (H)",
      });
    }

    let reply =
      String(data?.choices?.[0]?.message?.content ?? "").trim() ||
      String(data?.choices?.[0]?.text ?? "").trim() ||
      "";

    if (!reply) {
      return jsonResponse(502, {
        version: "AI v1.1",
        reply:
          "I’m having trouble answering right now. Please contact Lex Auto Solutions directly at 604-303-9020 or sales@lexauto.org. (H)",
      });
    }

    if (!reply.endsWith("(A)")) {
      reply = `${reply} (A)`;
    }

    return jsonResponse(200, {
      version: "AI v1.1",
      reply,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return jsonResponse(500, {
      version: "AI v1.1",
      reply:
        "I’m having trouble answering right now. Please contact Lex Auto Solutions directly at 604-303-9020 or sales@lexauto.org. (H)",
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
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
      "shop hours",
      "today",
    ]) && !hasAny(message, ["phone", "number"]);

  if (asksHours) {
    return "Lex Auto Solutions is open Monday to Saturday from 10:00 AM to 6:30 PM. The shop is closed on Sunday.";
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
    return "You can call Lex Auto Solutions at 604-303-9020.";
  }

  const asksEmail = hasAny(message, [
    "email",
    "mail",
    "e mail",
    "gmail",
    "contact email",
  ]);

  if (asksEmail) {
    return "You can email Lex Auto Solutions at sales@lexauto.org.";
  }

  const asksLocation = hasAny(message, [
    "where",
    "location",
    "located",
    "address",
    "where are you",
    "where is the shop",
    "richmond",
  ]);

  if (asksLocation) {
    return "Lex Auto Solutions is located at 5-11220 Voyageur Way, Richmond BC V6X 3E1.";
  }

  const asksAppointment = hasAny(message, [
    "appointment",
    "book",
    "booking",
    "schedule",
    "scheduled",
    "reserve",
  ]);

  if (asksAppointment) {
    return "To schedule an appointment, please call Lex Auto Solutions at 604-303-9020.";
  }

  const asksWarranty = hasAny(message, [
    "warranty",
    "dealer warranty",
    "keep my warranty",
    "manufacturer warranty",
  ]);

  if (asksWarranty) {
    return "You generally do not need to return to the dealership for regular maintenance to keep your warranty valid, as long as the work follows the manufacturer’s schedule and is properly documented.";
  }

  const asksBrakeFluid = hasAny(message, [
    "brake fluid",
    "fluid flush",
    "brake flush",
  ]);

  if (asksBrakeFluid) {
    return "Brake fluid should be changed periodically because it absorbs moisture over time, which can lead to corrosion and reduced brake system performance.";
  }

  const asksCoolant = hasAny(message, [
    "antifreeze",
    "coolant",
    "radiator fluid",
  ]);

  if (asksCoolant) {
    return "Coolant replacement intervals depend on the vehicle, so check your owner's manual or contact Lex Auto Solutions for guidance.";
  }

  const asksGeneralContact =
    hasAny(message, ["contact", "reach you", "reach us", "how do i contact"]) &&
    !hasAny(message, ["phone", "email"]);

  if (asksGeneralContact) {
    return "You can contact Lex Auto Solutions by phone at 604-303-9020 or by email at sales@lexauto.org.";
  }

  return null;
}