export async function POST(req: Request) {
  const body = await req.json();
  const message = String(body.message ?? "").trim();

  let reply = "";

  if (message === "1") {
    reply = "1 typed";
  } else if (message === "2") {
    reply = "2 typed";
  } else {
    reply = "1 or 2 not typed";
  }

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}