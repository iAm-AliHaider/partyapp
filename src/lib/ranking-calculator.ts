import prisma from "./prisma";
import { calculateMemberScore } from "./referral-engine";

/**
 * Recompute rankings for a specific constituency
 */
export async function computeConstituencyRankings(
  constituencyId: string,
  period?: string
): Promise<void> {
  const currentPeriod = period ?? getCurrentPeriod();

  // Get all active members in this constituency
  const members = await prisma.member.findMany({
    where: {
      constituencyId,
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

  // Upsert rankings
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const rank = i + 1;

    await prisma.ranking.upsert({
      where: {
        memberId_constituencyId_period: {
          memberId: s.memberId,
          constituencyId,
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
        constituencyId,
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
 * Get leaderboard for a constituency
 */
export async function getConstituencyLeaderboard(
  constituencyId: string,
  limit: number = 20,
  period?: string
) {
  const currentPeriod = period ?? getCurrentPeriod();

  return prisma.ranking.findMany({
    where: {
      constituencyId,
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
      constituency: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { rank: "asc" },
    take: limit,
  });
}

/**
 * Get national leaderboard (top members across all constituencies)
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
      constituency: {
        select: { code: true, name: true },
      },
    },
    orderBy: { score: "desc" },
    take: limit,
  });
}

/**
 * Get recommended candidates (rank 1 per constituency)
 */
export async function getRecommendedCandidates(
  type?: string,
  period?: string
) {
  const currentPeriod = period ?? getCurrentPeriod();

  return prisma.ranking.findMany({
    where: {
      period: currentPeriod,
      rank: 1,
      overridden: false,
      ...(type && {
        constituency: {
          type: type as any,
        },
      }),
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
      constituency: true,
    },
    orderBy: {
      constituency: { code: "asc" },
    },
  });
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
