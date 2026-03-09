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
    const body = await req.json().catch(() => ({}));
    const message = String(body.message ?? "").trim();

    return new Response(
      JSON.stringify({
        version: "AI v1.1",
        reply: message
          ? "I’m ready to help. (H)"
          : "Please send a message. (H)",
      }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return new Response(
      JSON.stringify({
        version: "AI v1.1",
        reply: "Backend crashed. (H)",
      }),
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
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