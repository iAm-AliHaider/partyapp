import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { randomUUID } from "crypto";

// GET /api/projects/:id/documents
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: any = { projectId: id };
  if (category) where.category = category;

  const documents = await prisma.document.findMany({
    where,
    include: { uploadedBy: { select: { name: true, membershipNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

// POST /api/projects/:id/documents — upload document (stores as base64 data URL)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = params;
  const memberId = (session.user as any).id;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "GENERAL";
  const description = formData.get("description") as string | null;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // 5MB max for DB storage
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  // Convert to base64 data URL for DB storage (works on Vercel - no filesystem needed)
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;

  const doc = await prisma.document.create({
    data: {
      projectId,
      uploadedById: memberId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      category: category as any,
      description,
      url: dataUrl,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(doc, { status: 201 });
}
