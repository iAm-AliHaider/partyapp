import prisma from "../src/lib/prisma";

async function main() {
  const party = await prisma.party.findFirst();
  const admin = await prisma.member.findFirst({ where: { role: "ADMIN" } });
  console.log("Party:", party?.id, "Admin:", admin?.id);

  const action = await prisma.droidClawAction.create({
    data: {
      type: "SEND_ANNOUNCEMENT",
      platform: "WHATSAPP",
      title: "Test: Send greeting via DroidClaw",
      payload: JSON.stringify({
        groupName: "Ali",
        message: "Assalam o Alaikum! Test message from DroidClaw bridge 🤖🇵🇰",
      }),
      status: "QUEUED",
      createdById: admin?.id!,
      partyId: party?.id!,
    },
  });

  console.log("✅ Created action:", action.id, "| Status:", action.status);
}

main().catch(console.error).finally(() => prisma.$disconnect());
