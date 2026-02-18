const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // How many members have referredById set?
  const withReferrer = await p.member.count({ where: { referredById: { not: null } } });
  
  // How many have districtId?
  const withDistrict = await p.member.count({ where: { districtId: { not: null } } });
  const withoutDistrict = await p.member.count({ where: { districtId: null } });
  
  // Ali's referrals (members who have referredById = Ali's id)
  const aliId = 'cmlorxwbh0001vt00xefh5ajn';
  const aliReferrals = await p.member.findMany({
    where: { referredById: aliId },
    select: { id: true, name: true, score: true, status: true }
  });

  // How was Ali's score set to 49? Check if there's any referral record
  const aliReferralRecords = await p.referral.findMany({
    where: { referrerId: aliId }
  });

  // Stats API returns totalProvinces but there's no such field
  const provinces = await p.province.count();

  console.log(JSON.stringify({
    withReferrer,
    withDistrict,
    withoutDistrict,
    aliReferrals,
    aliReferralRecords,
    provinces
  }, null, 2));

  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
