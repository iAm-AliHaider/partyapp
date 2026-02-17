import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const API_KEY = process.env.AGENT_API_KEY || "siyasat-agent-key-2026";

function authCheck(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) return false;
  return true;
}

// GET /api/droidclaw/pending — fetch QUEUED actions for the bridge
export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  const actions = await prisma.droidClawAction.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json({ actions });
}

// PATCH /api/droidclaw/pending — update action status/result from bridge
export async function PATCH(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, result, error } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const action = await prisma.droidClawAction.update({
    where: { id },
    data: {
      status,
      ...(result && { result: typeof result === "string" ? result : JSON.stringify(result) }),
      ...(error && { error }),
      ...(status === "RUNNING" && { startedAt: new Date() }),
      ...(["COMPLETED", "FAILED"].includes(status) && { completedAt: new Date() }),
    },
  });

  return NextResponse.json(action);
}
