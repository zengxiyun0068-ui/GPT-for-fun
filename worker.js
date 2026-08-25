const ALLOWED_ORIGIN = "https://zengxiyun0068-ui.github.io";
const MODEL = "gpt-5.5";

function cors(origin) {
  const ok = origin === ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (origin && origin !== ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers });

    try {
      const body = await request.json();
      const message = typeof body.message === "string" ? body.message.trim() : "";
      const previousResponseId = typeof body.previous_response_id === "string" ? body.previous_response_id : null;
      if (!message || message.length > 8000) {
        return new Response(JSON.stringify({ error: "Message must be 1-8000 characters." }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }

      const payload = {
        model: MODEL,
        instructions: "You are GPT living inside a tiny playful phone UI. Be helpful, natural, concise, and occasionally playful. The user is Chinese, so respond in the language they use.",
        input: message,
        store: true,
      };
      if (previousResponseId) payload.previous_response_id = previousResponseId;

      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: data?.error?.message || "OpenAI API error" }), { status: r.status, headers: { ...headers, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ id: data.id, text: data.output_text || "" }), { headers: { ...headers, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }
  },
};
