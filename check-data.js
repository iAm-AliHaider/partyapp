const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const mc = await p.member.count();
  const rc = await p.referral.count();
  const rkc = await p.ranking.count();
  
  const top = await p.member.findMany({
    orderBy: { score: 'desc' },
    take: 10,
    select: {
      id: true, name: true, score: true, rank: true,
      referralCode: true, referredById: true, districtId: true,
      status: true,
      _count: { select: { referrals: true } }
    }
  });

  const refs = await p.referral.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { referrerId: true, refereeId: true, level: true, points: true, status: true }
  });

  // Check members with referrals but score=0
  const zeroScoreWithRefs = await p.member.findMany({
    where: { score: 0, referrals: { some: {} } },
    select: { id: true, name: true, score: true, _count: { select: { referrals: true } } },
    take: 10
  });

  // Check members with score > 0 but no referral records
  const scoreNoRefs = await p.member.findMany({
    where: { score: { gt: 0 } },
    select: { id: true, name: true, score: true, _count: { select: { referrals: true } } },
    take: 10
  });

  // Check referralsSent counts
  const topSenders = await p.member.findMany({
    where: { referralsSent: { some: {} } },
    select: {
      id: true, name: true, score: true,
      _count: { select: { referrals: true, referralsSent: true } }
    },
    orderBy: { score: 'desc' },
    take: 10
  });

  console.log(JSON.stringify({
    counts: { members: mc, referrals: rc, rankings: rkc },
    topMembers: top,
    recentReferrals: refs,
    zeroScoreWithRefs,
    membersWithScore: scoreNoRefs,
    topSenders
  }, null, 2));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
