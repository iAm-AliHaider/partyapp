import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cnic = searchParams.get("cnic");

  if (!cnic) {
    return NextResponse.json({ error: "CNIC is required" }, { status: 400 });
  }

  const cleanCnic = cnic.replace(/-/g, "").trim();

  if (cleanCnic.length < 13) {
    return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
  }

  try {
    const member = await prisma.member.findFirst({
      where: { cnic: cleanCnic },
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        phone: true,
        cnic: true,
        membershipNumber: true,
        status: true,
        role: true,
        score: true,
        rank: true,
        referralCode: true,
        createdAt: true,
        party: { select: { name: true, logoUrl: true } },
        province: { select: { name: true } },
        district: { select: { name: true } },
        tehsil: { select: { name: true } },
        constituency: { select: { code: true, name: true } },
        _count: { select: { referrals: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ 
        found: false, 
        message: "Member not found. Please check your CNIC or register at the party office." 
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      member: {
        name: member.name,
        nameUrdu: member.nameUrdu,
        phone: member.phone,
        membershipNumber: member.membershipNumber,
        status: member.status,
        role: member.role,
        score: member.score,
        rank: member.rank,
        referralCode: member.referralCode,
        party: member.party,
        province: member.province?.name,
        district: member.district?.name,
        tehsil: member.tehsil?.name,
        constituency: member.constituency ? `${member.constituency.code} - ${member.constituency.name}` : null,
        referralCount: member._count.referrals,
        memberSince: member.createdAt,
        isVerified: member.status === "ACTIVE",
      },
    });
  } catch (error) {
    console.error("Member status lookup error:", error);
    return NextResponse.json({ error: "Failed to lookup member" }, { status: 500 });
  }
}