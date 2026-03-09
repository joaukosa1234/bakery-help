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
      },
    }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({
      version: "AI v1.1",
      reply: "I’m ready to help. (H)",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}