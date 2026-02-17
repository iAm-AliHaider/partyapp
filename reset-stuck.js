const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const result = await p.droidClawAction.updateMany({
    where: { status: 'RUNNING' },
    data: { status: 'FAILED', error: 'Reset: stuck in RUNNING state' }
  });
  console.log(`Reset ${result.count} stuck action(s) to FAILED`);
}
main().finally(() => p.$disconnect());
