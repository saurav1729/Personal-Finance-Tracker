import { sessions } from "@/app/lib/mcp-sessions";   // ← same globalThis-backed singleton

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`[MCP POST] Unknown session: ${sessionId}, known: [${[...sessions.keys()].join(", ")}]`);
    return Response.json({ error: `Unknown session: ${sessionId}` }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(`[MCP POST] session=${sessionId} method=${body?.method}`);

  try {
    const { transport } = session;
    if (!transport.onmessage) {
      return Response.json({ error: "Transport not ready" }, { status: 503 });
    }
    await transport.onmessage(body);
    return new Response(null, { status: 202 });
  } catch (err) {
    console.error("[MCP POST] Dispatch error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}