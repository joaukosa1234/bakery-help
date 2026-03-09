export async function GET() {
  return new Response(
    JSON.stringify({
      status: "Lex Auto Help API running",
      version: "AI v1.1",
    }),
    {
      status: 200,
      headers: corsHeaders(),
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

    return jsonResponse(200, {
      version: "AI v1.1",
      reply:
        "I’m not fully set up for that question yet. Please contact Lex Auto Solutions at 604-303-9020 or sales@lexauto.org. (H)",
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return jsonResponse(500, {
      version: "AI v1.1",
      reply: "Backend error. (H)",
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    "reserve",
  ]);

  if (asksAppointment) {
    return "To schedule an appointment, please call Lex Auto Solutions at 604-303-9020.";
  }

  const asksWarranty = hasAny(message, [
    "warranty",
    "keep my warranty",
    "dealer warranty",
    "manufacturer warranty",
  ]);

  if (asksWarranty) {
    return "You generally do not need to return to the dealership for regular maintenance to keep your warranty valid, as long as the work follows the manufacturer schedule and is properly documented.";
  }

  const asksBrakeFluid = hasAny(message, [
    "brake fluid",
    "brake flush",
    "fluid flush",
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
    hasAny(message, ["contact", "reach you", "how do i contact"]) &&
    !hasAny(message, ["phone", "email"]);

  if (asksGeneralContact) {
    return "You can contact Lex Auto Solutions by phone at 604-303-9020 or by email at sales@lexauto.org.";
  }

  return null;
}