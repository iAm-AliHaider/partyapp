import prisma from "../src/lib/prisma";

async function main() {
  const a = await prisma.droidClawAction.updateMany({
    where: { status: { in: ["RUNNING", "FAILED"] } },
    data: { status: "QUEUED", startedAt: null, completedAt: null, error: null, result: null },
  });
  console.log("Reset", a.count, "actions to QUEUED");
}

main().catch(console.error).finally(() => prisma.$disconnect());
