import prisma from "./prisma";

// Points configuration
const POINTS = {
  DIRECT: 10,    // Level 1 referral
  LEVEL_2: 5,    // Referral's referral
  LEVEL_3: 2,    // Third generation
  ACTIVE_BONUS: 3, // Per active referral
} as const;

export interface ReferralScore {
  memberId: string;
  directCount: number;
  level2Count: number;
  level3Count: number;
  activeCount: number;
  directPoints: number;
  level2Points: number;
  level3Points: number;
  activePoints: number;
  totalScore: number;
}

/**
 * Calculate referral score for a member
 */
export async function calculateMemberScore(memberId: string): Promise<ReferralScore> {
  // Get direct referrals (level 1)
  const directReferrals = await prisma.member.findMany({
    where: { referredById: memberId, status: "ACTIVE" },
    select: { id: true, status: true, lastActiveAt: true },
  });

  // Get level 2 referrals (referrals of my referrals)
  const directIds = directReferrals.map((r) => r.id);
  const level2Referrals = directIds.length > 0 ? await prisma.member.findMany({
    where: { referredById: { in: directIds }, status: "ACTIVE" },
    select: { id: true, status: true },
  }) : [];

  // Get level 3 referrals
  const level2Ids = level2Referrals.map((r) => r.id);
  const level3Referrals = level2Ids.length > 0 ? await prisma.member.findMany({
    where: { referredById: { in: level2Ids }, status: "ACTIVE" },
    select: { id: true },
  }) : [];

  // Count active referrals (active in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeCount = directReferrals.filter(
    (r) => r.lastActiveAt && r.lastActiveAt > thirtyDaysAgo
  ).length;

  const directCount = directReferrals.length;
  const level2Count = level2Referrals.length;
  const level3Count = level3Referrals.length;

  const directPoints = directCount * POINTS.DIRECT;
  const level2Points = level2Count * POINTS.LEVEL_2;
  const level3Points = level3Count * POINTS.LEVEL_3;
  const activePoints = activeCount * POINTS.ACTIVE_BONUS;

  return {
    memberId,
    directCount,
    level2Count,
    level3Count,
    activeCount,
    directPoints,
    level2Points,
    level3Points,
    activePoints,
    totalScore: directPoints + level2Points + level3Points + activePoints,
  };
}

/**
 * Process a new referral: create referral records for all 3 levels
 */
export async function processReferral(referrerId: string, refereeId: string): Promise<void> {
  // Level 1: direct referral
  await prisma.referral.create({
    data: {
      referrerId,
      refereeId,
      level: 1,
      points: POINTS.DIRECT,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  // Find referrer's referrer for level 2
  const referrer = await prisma.member.findUnique({
    where: { id: referrerId },
    select: { referredById: true },
  });

  if (referrer?.referredById) {
    await prisma.referral.create({
      data: {
        referrerId: referrer.referredById,
        refereeId,
        level: 2,
        points: POINTS.LEVEL_2,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    // Find level 3 (referrer's referrer's referrer)
    const grandReferrer = await prisma.member.findUnique({
      where: { id: referrer.referredById },
      select: { referredById: true },
    });

    if (grandReferrer?.referredById) {
      await prisma.referral.create({
        data: {
          referrerId: grandReferrer.referredById,
          refereeId,
          level: 3,
          points: POINTS.LEVEL_3,
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });
    }
  }

  // Update scores for all affected members
  await updateMemberScore(referrerId);
  if (referrer?.referredById) {
    await updateMemberScore(referrer.referredById);
    const grandReferrer = await prisma.member.findUnique({
      where: { id: referrer.referredById },
      select: { referredById: true },
    });
    if (grandReferrer?.referredById) {
      await updateMemberScore(grandReferrer.referredById);
    }
  }
}

/**
 * Update a member's total score
 */
async function updateMemberScore(memberId: string): Promise<void> {
  const score = await calculateMemberScore(memberId);
  await prisma.member.update({
    where: { id: memberId },
    data: { score: score.totalScore },
  });
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AR-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Check for circular referrals (fraud detection)
 */
export async function detectCircularReferral(
  referrerId: string,
  refereeId: string
): Promise<boolean> {
  let currentId: string | null = referrerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === refereeId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const result: { referredById: string | null } | null = await prisma.member.findUnique({
      where: { id: currentId },
      select: { referredById: true },
    });
    currentId = result?.referredById ?? null;
  }

  return false;
}
