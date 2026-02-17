import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const API_KEY = process.env.AGENT_API_KEY || "siyasat-agent-key-2026";

// POST /api/droidclaw/bridge-status — bridge pings this
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const status = await prisma.bridgeStatus.upsert({
    where: { id: "singleton" },
    update: {
      online: true,
      deviceConnected: body.deviceConnected ?? false,
      activeGoal: body.activeGoal ?? null,
      lastHeartbeat: new Date(),
    },
    create: {
      id: "singleton",
      online: true,
      deviceConnected: body.deviceConnected ?? false,
      activeGoal: body.activeGoal ?? null,
      lastHeartbeat: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    receivedAt: status.lastHeartbeat.toISOString(),
    deviceConnected: status.deviceConnected,
    activeGoal: status.activeGoal,
  });
}

// GET /api/droidclaw/bridge-status — admin UI checks this
export async function GET() {
  const status = await prisma.bridgeStatus.findUnique({
    where: { id: "singleton" },
  });

  if (!status) {
    return NextResponse.json({ online: false, lastHeartbeat: null, staleSeconds: null });
  }

  const staleSeconds = Math.floor((Date.now() - status.lastHeartbeat.getTime()) / 1000);
  const isOnline = staleSeconds < 90; // 90s tolerance

  return NextResponse.json({
    online: isOnline,
    deviceConnected: status.deviceConnected,
    activeGoal: status.activeGoal,
    lastHeartbeat: status.lastHeartbeat.toISOString(),
    staleSeconds,
  });
}
