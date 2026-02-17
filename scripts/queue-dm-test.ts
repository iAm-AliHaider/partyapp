import prisma from "../src/lib/prisma";

async function main() {
  await prisma.droidClawAction.deleteMany({});
  const party = await prisma.party.findFirst();
  const admin = await prisma.member.findFirst({ where: { role: "ADMIN" } });

  const a = await prisma.droidClawAction.create({
    data: {
      type: "BULK_MESSAGE",
      platform: "WHATSAPP",
      status: "QUEUED",
      title: "Test: DM Ali via DroidClaw",
      payload: JSON.stringify({
        contacts: ["+966 53 400 6682"],
        message: "Assalam o Alaikum! This message was sent by DroidClaw AI agent from PartyApp 🤖🇵🇰",
      }),
      createdById: admin!.id,
      partyId: party!.id,
    },
  });
  console.log("✅ Created:", a.id, a.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
