import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { validateCNIC } from "@/lib/cnic-validator";
import { generateReferralCode, processReferral } from "@/lib/referral-engine";
import { notifyNewMember } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, password, cnic, age, gender, religion, email, residentialStatus, country, referralCode, provinceId, districtId, tehsilId } = body;

    // Validate required fields
    if (!name || !phone || !password || !cnic) {
      return NextResponse.json({ error: "Name, phone, password, and CNIC are required" }, { status: 400 });
    }

    if (!districtId) {
      return NextResponse.json({ error: "Please select your district" }, { status: 400 });
    }

    // Validate CNIC
    const cnicInfo = validateCNIC(cnic);
    if (!cnicInfo.isValid) {
      return NextResponse.json({ error: cnicInfo.error }, { status: 400 });
    }

    // Check duplicates
    const existing = await prisma.member.findFirst({
      where: { OR: [{ phone }, { cnic: cnicInfo.raw }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Phone or CNIC already registered" }, { status: 409 });
    }

    // Verify district exists and get province
    const district = await prisma.district.findUnique({ where: { id: districtId }, include: { province: true } });
    if (!district) {
      return NextResponse.json({ error: "Invalid district selected" }, { status: 400 });
    }

    // Verify tehsil if provided
    if (tehsilId) {
      const tehsil = await prisma.tehsil.findUnique({ where: { id: tehsilId } });
      if (!tehsil || tehsil.districtId !== districtId) {
        return NextResponse.json({ error: "Invalid tehsil selected" }, { status: 400 });
      }
    }

    // Get or create default party
    let party = await prisma.party.findFirst();
    if (!party) {
      party = await prisma.party.create({
        data: { name: "Pakistan Awaam Raaj Tehreek", nameUrdu: "پاکستان عوام راج تحریک" },
      });
    }

    // Find referrer
    let referredById: string | undefined;
    let referrerName: string | undefined;
    if (referralCode) {
      const referrer = await prisma.member.findUnique({
        where: { referralCode },
        select: { id: true, name: true },
      });
      if (referrer) {
        referredById = referrer.id;
        referrerName = referrer.name;
      }
    }

    // Create member
    const passwordHash = await bcrypt.hash(password, 12);
    const newReferralCode = generateReferralCode();
    const memberCount = await prisma.member.count();
    const membershipNumber = `AR-${String(memberCount + 1).padStart(6, "0")}`;

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        passwordHash,
        cnic: cnicInfo.raw,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        religion: religion || null,
        email: email || null,
        residentialStatus: residentialStatus || "RESIDENT",
        country: country || "Pakistan",
        partyId: party.id,
        provinceId: district.provinceId,
        districtId,
        tehsilId: tehsilId || null,
        referralCode: newReferralCode,
        referredById,
        membershipNumber,
        status: "ACTIVE",
        isVerified: false,
      },
    });

    // Process referral chain if referred
    if (referredById) {
      await processReferral(referredById, member.id);
    }

    // Notify Boss via WhatsApp
    notifyNewMember({
      name,
      phone,
      membershipNumber,
      districtName: district.name,
      provinceName: district.province.name,
      referredBy: referrerName,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      membershipNumber,
      referralCode: newReferralCode,
      district: district.name,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
