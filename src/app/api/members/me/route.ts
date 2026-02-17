import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        nameUrdu: true,
        email: true,
        phone: true,
        cnic: true,
        age: true,
        gender: true,
        religion: true,
        photoUrl: true,
        residentialStatus: true,
        country: true,
        referralCode: true,
        membershipNumber: true,
        score: true,
        rank: true,
        status: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        party: { select: { name: true, nameUrdu: true, logoUrl: true } },
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        tehsil: { select: { id: true, name: true } },
        _count: { select: { referrals: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, nameUrdu, email, age, gender, religion, residentialStatus, country } = body;

    const updated = await prisma.member.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(nameUrdu !== undefined && { nameUrdu }),
        ...(email !== undefined && { email: email || null }),
        ...(age !== undefined && { age: age ? parseInt(age) : null }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(religion !== undefined && { religion: religion || null }),
        ...(residentialStatus && { residentialStatus }),
        ...(country && { country }),
        lastActiveAt: new Date(),
      },
      select: {
        id: true, name: true, email: true, phone: true, score: true, rank: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
