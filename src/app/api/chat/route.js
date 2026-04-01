import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    // Proxy the request to the new FastAPI Backend
    const backendRes = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Pipe the Server-Sent Events stream directly back to the client
    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("FastAPI backend error:", error);
    return NextResponse.json(
      { error: "AI Assistant is currently unavailable." },
      { status: 503 }
    );
  }
}