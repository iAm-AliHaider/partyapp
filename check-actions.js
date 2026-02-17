const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const actions = await p.droidClawAction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, type: true, title: true, status: true, payload: true, error: true, createdAt: true }
  });
  console.log(JSON.stringify(actions, null, 2));
}
main().finally(() => p.$disconnect());
