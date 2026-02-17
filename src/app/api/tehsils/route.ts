import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("districtId");

  if (!districtId) {
    return NextResponse.json({ error: "districtId required" }, { status: 400 });
  }

  try {
    const tehsils = await prisma.tehsil.findMany({
      where: { districtId },
      select: {
        id: true,
        name: true,
        nameUrdu: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tehsils });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tehsils" }, { status: 500 });
  }
}
