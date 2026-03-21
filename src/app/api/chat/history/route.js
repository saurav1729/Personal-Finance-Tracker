// app/api/chat/history/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import ChatSession from "@/app/models/ChatSession";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    await dbConnect();

    let session = await ChatSession.findOne({ userId });
    if (!session) {
      session = await ChatSession.create({ userId, messages: [] });
    }

    // ✅ Bug fix #23: Return only user/assistant messages — no tool messages.
    //    Tool messages reconstructed without their matching tool_calls cause
    //    Groq API schema validation errors.
    // ✅ Bug fix #24: Limit to last 50 messages to prevent massive payloads.
    const messages = session.messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-50)
      .map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("[chat/history] Error:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}