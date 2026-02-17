import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.member.findFirst({
    where: { partyId: 'cmlpeujei0000l7ciiynr7mlk', role: 'ADMIN' },
    select: { id: true }
  });
  if (!admin) { console.log('No admin found'); return; }

  const action = await prisma.droidClawAction.create({
    data: {
      type: 'BULK_MESSAGE',
      title: 'Bridge v1.2 test - clear goals',
      status: 'QUEUED',
      payload: JSON.stringify({
        contacts: ['+966534006682'],
        message: 'Hey Boss! DroidClaw v1.2 bridge working - message clarity fix deployed'
      }),
      partyId: 'cmlpeujei0000l7ciiynr7mlk',
      createdById: admin.id
    }
  });

  console.log('Queued action:', action.id);
  await prisma.$disconnect();
}

main();
