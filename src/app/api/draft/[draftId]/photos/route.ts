import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 클라이언트가 Supabase 에 사진을 직접 올린 뒤, 그 결과 메타데이터를 보내 Photo 레코드를 만든다.
const bodySchema = z.object({
  photos: z
    .array(
      z.object({
        order: z.number().int().min(0).max(99),
        storageKey: z.string().min(1),
        publicUrl: z.string().url(),
        mimeType: z.string().min(3).max(100),
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

  // 같은 draft 의 기존 Photo 들을 비우고 새로 기록 (재시도 안전)
  await prisma.photo.deleteMany({ where: { draftId } });

  await prisma.photo.createMany({
    data: parsed.data.photos.map((p) => ({
      draftId,
      storageKey: p.storageKey,
      publicUrl: p.publicUrl,
      mimeType: p.mimeType,
      order: p.order,
    })),
  });

  return NextResponse.json({ count: parsed.data.photos.length });
}
