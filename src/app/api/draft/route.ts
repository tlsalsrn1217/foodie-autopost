import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { uploadDraftPhoto } from "@/lib/storage";
import { placeSchema } from "@/lib/schemas/draftFormSchema";

export const runtime = "nodejs";
export const maxDuration = 60;

const keywordsSchema = z.array(z.string().min(1).max(20)).max(10);

export async function POST(request: Request) {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData 파싱 실패" }, { status: 400 });
  }

  const rawPhotos = fd.getAll("photos");
  const photos = rawPhotos.filter((p): p is File => p instanceof File);

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "사진을 한 장 이상 올려주세요" },
      { status: 400 },
    );
  }
  if (photos.length > 10) {
    return NextResponse.json(
      { error: "사진은 최대 10장까지" },
      { status: 400 },
    );
  }

  const mood = (fd.get("mood") as string | null) ?? "";
  const keywordsRaw = (fd.get("keywords") as string | null) ?? "[]";
  const placeRaw = fd.get("place") as string | null;

  let keywords: string[];
  try {
    keywords = keywordsSchema.parse(JSON.parse(keywordsRaw));
  } catch {
    return NextResponse.json({ error: "keywords 형식 오류" }, { status: 400 });
  }

  let place: z.infer<typeof placeSchema> | undefined;
  if (placeRaw) {
    try {
      place = placeSchema.parse(JSON.parse(placeRaw));
    } catch {
      return NextResponse.json({ error: "place 형식 오류" }, { status: 400 });
    }
  }

  const draft = await prisma.draft.create({
    data: {
      mood: mood || null,
      keywords,
      placeName: place?.name,
      placeAddr: place?.roadAddress ?? place?.address,
      placeUrl: place?.url,
      placeLat: place?.lat,
      placeLng: place?.lng,
    },
  });

  try {
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const photoIdx = String(i).padStart(2, "0");
      const { storageKey, publicUrl, mimeType } = await uploadDraftPhoto(
        draft.id,
        photoIdx,
        file,
      );
      await prisma.photo.create({
        data: {
          draftId: draft.id,
          storageKey,
          publicUrl,
          mimeType,
          order: i,
        },
      });
    }
  } catch (e) {
    await prisma.draft.update({
      where: { id: draft.id },
      data: { status: "FAILED" },
    });
    const msg = e instanceof Error ? e.message : "업로드 중 오류";
    return NextResponse.json(
      { error: msg, draftId: draft.id },
      { status: 500 },
    );
  }

  return NextResponse.json({ draftId: draft.id });
}
