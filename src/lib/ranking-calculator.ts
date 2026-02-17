import prisma from "./prisma";
import { calculateMemberScore } from "./referral-engine";

/**
 * Recompute rankings for a specific district
 */
export async function computeDistrictRankings(
  districtId: string,
  period?: string
): Promise<void> {
  const currentPeriod = period ?? getCurrentPeriod();

  // Get all active members in this district
  const members = await prisma.member.findMany({
    where: {
      districtId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // Calculate scores for all members
  const scores = await Promise.all(
    members.map(async (m) => {
      const score = await calculateMemberScore(m.id);
      return score;
    })
  );

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Get district's province
  const district = await prisma.district.findUnique({ where: { id: districtId }, select: { provinceId: true } });

  // Upsert rankings
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const rank = i + 1;

    await prisma.ranking.upsert({
      where: {
        memberId_districtId_period: {
          memberId: s.memberId,
          districtId,
          period: currentPeriod,
        },
      },
      update: {
        score: s.totalScore,
        rank,
        directReferrals: s.directCount,
        level2Referrals: s.level2Count,
        level3Referrals: s.level3Count,
        activeBonus: s.activePoints,
        isCandidate: rank === 1,
        computedAt: new Date(),
      },
      create: {
        memberId: s.memberId,
        districtId,
        provinceId: district?.provinceId,
        score: s.totalScore,
        rank,
        directReferrals: s.directCount,
        level2Referrals: s.level2Count,
        level3Referrals: s.level3Count,
        activeBonus: s.activePoints,
        isCandidate: rank === 1,
        period: currentPeriod,
      },
    });

    // Update member's rank
    await prisma.member.update({
      where: { id: s.memberId },
      data: { score: s.totalScore, rank },
    });
  }
}

/**
 * Get leaderboard for a district
 */
export async function getDistrictLeaderboard(
  districtId: string,
  limit: number = 20,
  period?: string
) {
  const currentPeriod = period ?? getCurrentPeriod();

  return prisma.ranking.findMany({
    where: {
      districtId,
      period: currentPeriod,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          referralCode: true,
          membershipNumber: true,
        },
      },
      district: {
        select: {
          name: true,
          province: { select: { name: true } },
        },
      },
    },
    orderBy: { rank: "asc" },
    take: limit,
  });
}

/**
 * Get national leaderboard (top members across all districts)
 */
export async function getNationalLeaderboard(limit: number = 50) {
  return prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      score: true,
      rank: true,
      referralCode: true,
      district: {
        select: { name: true, province: { select: { name: true } } },
      },
    },
    orderBy: { score: "desc" },
    take: limit,
  });
}

/**
 * Get recommended candidates (rank 1 per district)
 */
export async function getRecommendedCandidates(
  provinceId?: string,
  period?: string
) {
  const currentPeriod = period ?? getCurrentPeriod();

  return prisma.ranking.findMany({
    where: {
      period: currentPeriod,
      rank: 1,
      overridden: false,
      ...(provinceId && { provinceId }),
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          score: true,
          phone: true,
          cnic: true,
        },
      },
      district: {
        include: { province: true },
      },
    },
    orderBy: {
      district: { name: "asc" },
    },
  });
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
