import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm/provider";
import type { GenerateInput } from "@/lib/llm/types";
import { parseReview } from "@/lib/llm/parseFrontmatter";

export const runtime = "nodejs";
export const maxDuration = 60;

async function fetchPhotoBytes(url: string, mimeType: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`사진 fetch 실패: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { data: buf, mimeType };
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const { draftId } = await ctx.params;

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!draft) {
    return new Response("Draft not found", { status: 404 });
  }
  if (draft.photos.length === 0) {
    return new Response("사진이 없는 draft 입니다", { status: 400 });
  }

  await prisma.draft.update({
    where: { id: draftId },
    data: { status: "GENERATING" },
  });

  const photoBytes = await Promise.all(
    draft.photos.map((p) =>
      p.publicUrl
        ? fetchPhotoBytes(p.publicUrl, p.mimeType)
        : Promise.reject(new Error("publicUrl 없는 사진이 있어요")),
    ),
  );

  const input: GenerateInput = {
    mood: draft.mood ?? undefined,
    keywords: draft.keywords,
    place: draft.placeName
      ? {
          name: draft.placeName,
          address: draft.placeAddr ?? "",
          roadAddress: draft.placeAddr ?? undefined,
          url: draft.placeUrl ?? undefined,
          lat: draft.placeLat ?? 0,
          lng: draft.placeLng ?? 0,
        }
      : undefined,
    photos: draft.photos.map((p, i) => ({
      storageKey: p.storageKey,
      publicUrl: p.publicUrl ?? undefined,
      mimeType: p.mimeType,
      order: p.order ?? i,
    })),
    photoBytes,
  };

  const provider = getLLM();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = "";
      try {
        for await (const chunk of provider.streamReview(input)) {
          accumulated += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        const { meta, title } = parseReview(accumulated);
        await prisma.draft.update({
          where: { id: draftId },
          data: {
            reviewMarkdown: accumulated,
            title,
            seoSummary: meta.summary,
            seoCategory: meta.category,
            seoTags: meta.tags,
            status: "READY",
            llmProvider: provider.name,
            llmModel: provider.model,
          },
        });
        controller.close();
      } catch (e) {
        await prisma.draft
          .update({
            where: { id: draftId },
            data: { status: "FAILED" },
          })
          .catch(() => {});
        const msg = e instanceof Error ? e.message : "생성 실패";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
