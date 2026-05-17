import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createPhotoUploadSlots } from "@/lib/storage";

export const runtime = "nodejs";

const bodySchema = z.object({
  files: z
    .array(
      z.object({
        mimeType: z.string().min(3).max(100),
        filename: z.string().max(255).optional(),
      }),
    )
    .min(1)
    .max(10),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const { draftId } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON parse 실패" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "유효하지 않은 입력", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    select: { id: true },
  });
  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  try {
    const slots = await createPhotoUploadSlots(draftId, parsed.data.files);
    return NextResponse.json({ slots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "signed URL 발급 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
