export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();

    if (!message) {
      return new Response(
        JSON.stringify({
          version: "1.1",
          reply: "Please send a message.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          version: "1.1",
          reply: "Missing OPENROUTER_API_KEY.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
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

Answer briefly, clearly, and helpfully.
If something is not listed above, say you are not sure and suggest contacting the bakery directly.
Do not invent pricing, inventory, or policies.
`.trim();

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("OpenRouter error:", errorText);

      return new Response(
        JSON.stringify({
          version: "1.1",
          reply: "AI service error. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const data = await aiRes.json();
    const reply =
      String(data?.choices?.[0]?.message?.content ?? "").trim() ||
      "Sorry, I could not generate a reply.";

    return new Response(
      JSON.stringify({
        version: "1.1",
        reply,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Chat route error:", error);

    return new Response(
      JSON.stringify({
        version: "1.1",
        reply: "Server error.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
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