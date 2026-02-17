import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const provinces = await prisma.province.findMany({
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        code: true,
        _count: { select: { districts: true, members: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ provinces });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch provinces" }, { status: 500 });
  }
}
