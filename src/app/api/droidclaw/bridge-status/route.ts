import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.AGENT_API_KEY || "siyasat-agent-key-2026";

// In-memory heartbeat tracker (resets on cold start)
let lastHeartbeat: Date | null = null;

// POST /api/droidclaw/bridge-status — bridge pings this
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  lastHeartbeat = new Date();

  return NextResponse.json({
    ok: true,
    receivedAt: lastHeartbeat.toISOString(),
    deviceConnected: body.deviceConnected ?? false,
    activeGoal: body.activeGoal ?? null,
  });
}

// GET /api/droidclaw/bridge-status — admin UI checks this
export async function GET(req: NextRequest) {
  const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat.getTime()) < 90_000; // 90s tolerance

  return NextResponse.json({
    online: !!isOnline,
    lastHeartbeat: lastHeartbeat?.toISOString() ?? null,
    staleSeconds: lastHeartbeat ? Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000) : null,
  });
}
