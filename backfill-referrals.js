/**
 * Backfill referrals table from member.referredById relationships
 * and recompute all scores + rankings
 */
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

const POINTS = { DIRECT: 10, LEVEL_2: 5, LEVEL_3: 2 };

async function main() {
  console.log('=== Backfill Referrals & Rankings ===\n');

  // 1. Get all members with a referrer
  const membersWithReferrer = await p.member.findMany({
    where: { referredById: { not: null } },
    select: { id: true, name: true, referredById: true, status: true }
  });

  console.log(`Members with referredById: ${membersWithReferrer.length}`);

  // 2. Create Referral records for all 3 levels
  let created = 0;
  for (const m of membersWithReferrer) {
    // Level 1
    try {
      await p.referral.upsert({
        where: { referrerId_refereeId: { referrerId: m.referredById, refereeId: m.id } },
        update: { level: 1, points: POINTS.DIRECT, status: 'VERIFIED', verifiedAt: new Date() },
        create: { referrerId: m.referredById, refereeId: m.id, level: 1, points: POINTS.DIRECT, status: 'VERIFIED', verifiedAt: new Date() }
      });
      created++;
    } catch (e) { console.log(`Skip L1 ${m.name}: ${e.message}`); }

    // Level 2 - find referrer's referrer
    const referrer = await p.member.findUnique({ where: { id: m.referredById }, select: { referredById: true } });
    if (referrer?.referredById) {
      try {
        await p.referral.upsert({
          where: { referrerId_refereeId: { referrerId: referrer.referredById, refereeId: m.id } },
          update: { level: 2, points: POINTS.LEVEL_2, status: 'VERIFIED', verifiedAt: new Date() },
          create: { referrerId: referrer.referredById, refereeId: m.id, level: 2, points: POINTS.LEVEL_2, status: 'VERIFIED', verifiedAt: new Date() }
        });
        created++;
      } catch (e) {}

      // Level 3
      const grand = await p.member.findUnique({ where: { id: referrer.referredById }, select: { referredById: true } });
      if (grand?.referredById) {
        try {
          await p.referral.upsert({
            where: { referrerId_refereeId: { referrerId: grand.referredById, refereeId: m.id } },
            update: { level: 3, points: POINTS.LEVEL_3, status: 'VERIFIED', verifiedAt: new Date() },
            create: { referrerId: grand.referredById, refereeId: m.id, level: 3, points: POINTS.LEVEL_2, status: 'VERIFIED', verifiedAt: new Date() }
          });
          created++;
        } catch (e) {}
      }
    }
  }
  console.log(`Referral records created/updated: ${created}`);

  // 3. Recompute scores for ALL members who have referrals (sent)
  const referrers = await p.referral.findMany({
    distinct: ['referrerId'],
    select: { referrerId: true }
  });

  console.log(`\nRecomputing scores for ${referrers.length} referrers...`);

  for (const r of referrers) {
    const directCount = await p.member.count({ where: { referredById: r.referrerId, status: 'ACTIVE' } });
    const directIds = (await p.member.findMany({ where: { referredById: r.referrerId, status: 'ACTIVE' }, select: { id: true } })).map(m => m.id);
    
    const level2Count = directIds.length > 0 
      ? await p.member.count({ where: { referredById: { in: directIds }, status: 'ACTIVE' } }) 
      : 0;
    
    const level2Ids = directIds.length > 0 
      ? (await p.member.findMany({ where: { referredById: { in: directIds }, status: 'ACTIVE' }, select: { id: true } })).map(m => m.id) 
      : [];
    
    const level3Count = level2Ids.length > 0 
      ? await p.member.count({ where: { referredById: { in: level2Ids }, status: 'ACTIVE' } }) 
      : 0;

    const totalScore = (directCount * 10) + (level2Count * 5) + (level3Count * 2);
    
    await p.member.update({
      where: { id: r.referrerId },
      data: { score: totalScore }
    });
  }

  // Reset score for members who are NOT referrers
  const referrerIds = referrers.map(r => r.referrerId);
  if (referrerIds.length > 0) {
    await p.member.updateMany({
      where: { id: { notIn: referrerIds }, score: { gt: 0 } },
      data: { score: 0 }
    });
  }

  // 4. Compute rankings per district
  const districts = await p.district.findMany({
    where: { members: { some: { status: 'ACTIVE' } } },
    select: { id: true, name: true, provinceId: true }
  });

  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  console.log(`\nComputing rankings for ${districts.length} districts (period: ${period})...`);

  let totalRanked = 0;
  for (const d of districts) {
    const members = await p.member.findMany({
      where: { districtId: d.id, status: 'ACTIVE' },
      select: { id: true, score: true },
      orderBy: { score: 'desc' }
    });

    for (let i = 0; i < members.length; i++) {
      const rank = i + 1;
      await p.ranking.upsert({
        where: { memberId_districtId_period: { memberId: members[i].id, districtId: d.id, period } },
        update: { score: members[i].score, rank, computedAt: new Date() },
        create: {
          memberId: members[i].id,
          districtId: d.id,
          provinceId: d.provinceId,
          score: members[i].score,
          rank,
          period,
          isCandidate: rank === 1
        }
      });

      await p.member.update({
        where: { id: members[i].id },
        data: { rank }
      });
      totalRanked++;
    }
  }

  console.log(`Ranked ${totalRanked} members across ${districts.length} districts`);

  // 5. Final counts
  const finalRefCount = await p.referral.count();
  const finalRankCount = await p.ranking.count();
  const topScorers = await p.member.findMany({
    orderBy: { score: 'desc' },
    where: { score: { gt: 0 } },
    take: 5,
    select: { name: true, score: true, rank: true, _count: { select: { referrals: true } } }
  });

  console.log(`\n=== DONE ===`);
  console.log(`Referral records: ${finalRefCount}`);
  console.log(`Ranking records: ${finalRankCount}`);
  console.log(`Top scorers:`, JSON.stringify(topScorers, null, 2));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
