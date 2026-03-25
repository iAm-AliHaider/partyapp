import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function formatSmsStatus(member: any): string {
  const lines = [
    `Party Membership Status`,
    `Name: ${member.name}`,
    `Status: ${member.status}`,
    `Rank: ${member.rank || 'N/A'} | Score: ${member.score}`,
    member.district ? `District: ${member.district.name}` : null,
    member.province ? `Province: ${member.province.name}` : null,
    `Code: ${member.referralCode}`,
  ].filter(Boolean);

  return lines.join(" | ");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const message = searchParams.get("message") || searchParams.get("text");

    if (!from) {
      return NextResponse.json({ error: "Missing from parameter" }, { status: 400 });
    }

    const cleanPhone = from.replace(/[^0-9]/g, "");
    const command = (message || "").toLowerCase().trim();

    let response: string;

    if (!command || command === "status") {
      const member = await prisma.member.findFirst({
        where: { phone: { endsWith: cleanPhone.slice(-10) } },
        select: {
          name: true,
          membershipNumber: true,
          status: true,
          rank: true,
          score: true,
          referralCode: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
        },
      });

      if (!member) {
        response = "No membership found with this number. Visit partyapp.middlemind.ai to register.";
      } else {
        response = formatSmsStatus(member);
      }
    } else if (command.startsWith("rank ") || command.startsWith("cnic ")) {
      const identifier = command.replace(/^(rank|cnic)\s+/i, "").trim();
      const cleanCnic = identifier.replace(/-/g, "");

      if (cleanCnic.length < 13) {
        response = "Invalid CNIC format. Use: cnic 1234512345678";
      }

      const member = await prisma.member.findFirst({
        where: { cnic: cleanCnic },
        select: {
          name: true,
          membershipNumber: true,
          status: true,
          rank: true,
          score: true,
          referralCode: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
        },
      });

      if (!member) {
        response = "No member found with this CNIC.";
      } else {
        response = formatSmsStatus(member);
      }
    } else if (command === "top" || command === "leaderboard") {
      const topMembers = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 } },
        select: {
          name: true,
          score: true,
          rank: true,
          district: { select: { name: true } },
        },
        orderBy: { rank: "asc" },
        take: 5,
      });

      if (topMembers.length === 0) {
        response = "No ranked members yet.";
      } else {
        response = "Top Members: " + topMembers.map((m, i) => 
          `${i+1}. ${m.name} (${m.score}pts)`
        ).join(" | ");
      }
    } else if (command === "help") {
      response = "Party App SMS Commands: STATUS, CNIC <number>, TOP, HELP";
    } else {
      response = "Party App: Reply STATUS for your membership status, or visit partyapp.middlemind.ai";
    }

    return NextResponse.json({ 
      reply: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SMS bot error:", error);
    return NextResponse.json({ error: "Failed to process SMS" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}