import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function formatMemberStatus(member: any): string {
  const lines = [
    `*Party Membership Status*`,
    ``,
    `Name: ${member.name}`,
    member.nameUrdu ? `(${member.nameUrdu})` : null,
    `Membership #: ${member.membershipNumber || 'N/A'}`,
    `Status: ${member.status}`,
    `Rank: ${member.rank || 'Unranked'}`,
    `Score: ${member.score}`,
    member.district ? `District: ${member.district.name}` : null,
    member.province ? `Province: ${member.province.name}` : null,
    member.constituency ? `Constituency: ${member.constituency.code}` : null,
    `Referral Code: ${member.referralCode}`,
    ``,
    `Member since: ${new Date(member.createdAt).toLocaleDateString()}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function formatLeaderboardEntry(entry: any, index: number): string {
  return `${index + 1}. ${entry.name} - Score: ${entry.score}${entry.district ? ` (${entry.district.name})` : ""}`;
}

function formatLeaderboard(entries: any[]): string {
  if (entries.length === 0) {
    return "No leaderboard data available.";
  }
  const lines = [
    `*Top Members Leaderboard*`,
    ``,
    ...entries.slice(0, 10).map(formatLeaderboardEntry),
    ``,
    entries.length > 10 ? `... and ${entries.length - 10} more` : null,
    ``,
    `Visit the app for full rankings`,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, message, type } = body;

    if (!from || !message) {
      return NextResponse.json({ error: "Missing from or message" }, { status: 400 });
    }

    const cleanPhone = from.replace(/[^0-9]/g, "");
    const command = message.toLowerCase().trim();

    let response: string;

    if (command === "status" || command === "check" || command === "my status") {
      const member = await prisma.member.findFirst({
        where: { phone: { endsWith: cleanPhone.slice(-10) } },
        select: {
          name: true,
          nameUrdu: true,
          membershipNumber: true,
          status: true,
          rank: true,
          score: true,
          referralCode: true,
          createdAt: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { code: true, name: true } },
        },
      });

      if (!member) {
        response = "No membership found with this number. Please visit the party office to register.";
      } else {
        response = formatMemberStatus(member);
      }
    } else if (command.startsWith("rank ") || command.startsWith("check cnic ")) {
      const identifier = command.replace(/^(rank|check cnic)\s+/i, "").trim();
      const cleanCnic = identifier.replace(/-/g, "");

      const member = await prisma.member.findFirst({
        where: { cnic: cleanCnic },
        select: {
          name: true,
          nameUrdu: true,
          membershipNumber: true,
          status: true,
          rank: true,
          score: true,
          referralCode: true,
          createdAt: true,
          province: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { code: true, name: true } },
        },
      });

      if (!member) {
        response = "No member found with this CNIC.";
      } else {
        response = formatMemberStatus(member);
      }
    } else if (command === "leaderboard" || command === "top" || command === "ranks") {
      const topMembers = await prisma.member.findMany({
        where: { status: "ACTIVE", score: { gt: 0 } },
        select: {
          name: true,
          score: true,
          district: { select: { name: true } },
        },
        orderBy: { rank: "asc" },
        take: 10,
      });

      response = formatLeaderboard(topMembers);
    } else if (command.startsWith("leaderboard ") || command.startsWith("district ")) {
      const districtName = command.replace(/^(leaderboard|district)\s+/i, "").trim();
      
      const district = await prisma.district.findFirst({
        where: { name: { equals: districtName, mode: "insensitive" } },
      });

      if (!district) {
        response = `District "${districtName}" not found.`;
      } else {
        const topMembers = await prisma.member.findMany({
          where: { status: "ACTIVE", score: { gt: 0 }, districtId: district.id },
          select: {
            name: true,
            score: true,
            district: { select: { name: true } },
          },
          orderBy: { rank: "asc" },
          take: 10,
        });

        response = `*Top Members - ${district.name}*\n\n${formatLeaderboard(topMembers)}`;
      }
    } else if (command === "help" || command === "?") {
      response = `*Party App Commands*\n\n` +
        `1. *status* - Check your membership status\n` +
        `2. *rank <cnic>* - Check status by CNIC\n` +
        `3. *leaderboard* - View national top 10\n` +
        `4. *district <name>* - View district leaderboard\n` +
        `5. *help* - Show this message`;
    } else {
      response = `Welcome to Party App!\n\n` +
        `Send *help* to see available commands.\n\n` +
        `Or visit partyapp.middlemind.ai to access the full app.`;
    }

    return NextResponse.json({ 
      reply: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WhatsApp bot error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: "ok",
    bot: "PartyApp WhatsApp Bot v1.0",
    commands: ["status", "rank <cnic>", "leaderboard", "district <name>", "help"],
  });
}