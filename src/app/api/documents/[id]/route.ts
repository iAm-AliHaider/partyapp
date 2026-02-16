import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { unlink } from "fs/promises";
import { join } from "path";

// DELETE /api/documents/:id — delete a document (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Delete file from disk
  try {
    const filePath = join(process.cwd(), "public", doc.url);
    await unlink(filePath);
  } catch (e) {
    // File might already be deleted, continue
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

