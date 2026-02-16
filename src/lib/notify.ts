import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BOSS_NUMBER = "+966534006682";

/**
 * Send a WhatsApp message via OpenClaw CLI
 */
export async function sendWhatsApp(target: string, message: string): Promise<boolean> {
  try {
    const escaped = message.replace(/"/g, '\\"').replace(/\n/g, "\\n");
    await execAsync(`openclaw message send --target "${target}" --message "${escaped}"`, {
      timeout: 15000,
    });
    return true;
  } catch (error) {
    console.error("WhatsApp notify failed:", error);
    return false;
  }
}

/**
 * Notify Boss about a new member registration
 */
export async function notifyNewMember(member: {
  name: string;
  phone: string;
  membershipNumber: string;
  constituencyCode: string;
  constituencyName: string;
  referredBy?: string;
}): Promise<void> {
  const lines = [
    `🌙 *New Member Registered!*`,
    ``,
    `👤 *${member.name}*`,
    `📋 ${member.membershipNumber}`,
    `🗺️ ${member.constituencyCode} — ${member.constituencyName}`,
    `📱 ${member.phone}`,
  ];

  if (member.referredBy) {
    lines.push(`🔗 Referred by: ${member.referredBy}`);
  }

  lines.push(``, `⏰ ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`);

  await sendWhatsApp(BOSS_NUMBER, lines.join("\n"));
}
