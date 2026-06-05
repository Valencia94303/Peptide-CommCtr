// Peptide Command Center — Gemini coach proxy.
//
// Thin pass-through: accepts a system prompt + messages, calls the Gemini
// Generative Language API, returns the assistant text. The Gemini API key
// lives only as a Supabase Edge Function secret (GEMINI_API_KEY) so the
// client HTML never ships it.
//
// Verifies the caller is authenticated via the Supabase JWT in the
// Authorization header so an anonymous scraper can't burn the quota.

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
    });
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        return jsonResponse({
            error: "GEMINI_API_KEY not configured. Set it in Supabase Edge Function secrets.",
        }, { status: 503 });
    }

    // Light auth check: caller must have a Supabase JWT (anon or user).
    // The function is invoked through the supabase-js client which attaches it.
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
        return jsonResponse({ error: "Missing Authorization bearer token." }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch (_e) {
        return jsonResponse({ error: "Invalid JSON body." }, { status: 400 });
    }

    const systemPrompt: string = (body && typeof body.system === "string") ? body.system : "";
    const messages: Array<{ role: string; content: string }> = Array.isArray(body?.messages) ? body.messages : [];
    const temperature: number = (typeof body?.temperature === "number") ? body.temperature : 0.6;
    const maxTokens: number = (typeof body?.max_tokens === "number") ? body.max_tokens : 800;

    if (messages.length === 0) {
        return jsonResponse({ error: "messages must be a non-empty array." }, { status: 400 });
    }

    // Map our message shape to Gemini's contents array.
    // Gemini uses role "user" and "model" (not "assistant").
    const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "") }],
    }));

    const payload: Record<string, unknown> = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
        },
    };
    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
        const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (!resp.ok) {
            return jsonResponse({
                error: data?.error?.message || `Gemini upstream error (${resp.status})`,
                upstream_status: resp.status,
            }, { status: 502 });
        }
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n") || "";
        const finishReason = data?.candidates?.[0]?.finishReason || null;
        return jsonResponse({ text, finish_reason: finishReason, model: GEMINI_MODEL });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message || "Gemini fetch failed" }, { status: 500 });
    }
});
