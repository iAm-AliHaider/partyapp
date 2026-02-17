import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find admin member
  const admin = await prisma.member.findFirst({
    where: { partyId: 'cmlpeujei0000l7ciiynr7mlk', role: 'ADMIN' },
    select: { id: true }
  });
  if (!admin) { console.log('No admin found'); return; }

  const now = new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' });

  const action = await prisma.droidClawAction.create({
    data: {
      type: 'BULK_MESSAGE',
      title: 'DroidClaw Live Test v2',
      status: 'QUEUED',
      payload: JSON.stringify({
        contacts: ['+966 53 400 6682'],
        message: `Salam Boss! DroidClaw is alive. Fresh test at ${now} PKT. PartyApp integration working end-to-end!`
      }),
      partyId: 'cmlpeujei0000l7ciiynr7mlk',
      createdById: admin.id
    }
  });

  console.log('Queued action:', action.id);
  await prisma.$disconnect();
}

main();
