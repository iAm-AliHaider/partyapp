import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// GET /api/projects/:id/documents — list documents for a project
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

// POST /api/projects/:id/documents — upload document
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = params;
  const memberId = (session.user as any).id;

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "GENERAL";
  const description = formData.get("description") as string | null;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Save file
  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "documents", projectId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const url = `/uploads/documents/${projectId}/${filename}`;

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
      url,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(doc, { status: 201 });
}

