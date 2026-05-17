import "server-only";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/llm/prompts/reviewPrompt";
import {
  FULL_REVISE_SYSTEM_SUFFIX,
  buildFullRevisePrompt,
} from "@/lib/llm/prompts/revisePrompt";
import { parseReview } from "@/lib/llm/parseFrontmatter";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  instruction: z.string().min(1).max(1000),
});

async function fetchPhotoBytes(url: string, mimeType: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`사진 fetch 실패: ${res.status}`);
  return {
    data: new Uint8Array(await res.arrayBuffer()),
    mimeType,
  };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const { draftId } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("JSON parse 실패", { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response("유효하지 않은 입력", { status: 400 });
  }

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
  if (!draft) return new Response("Not found", { status: 404 });
  if (!draft.reviewMarkdown) {
    return new Response("아직 글이 없는 draft 입니다", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("GEMINI_API_KEY 없음", { status: 500 });
  }

  const photoBytes = await Promise.all(
    draft.photos
      .filter((p) => p.publicUrl)
      .map((p) => fetchPhotoBytes(p.publicUrl as string, p.mimeType)),
  );

  const userPrompt = buildFullRevisePrompt({
    currentMarkdown: draft.reviewMarkdown,
    instruction: parsed.data.instruction,
  });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];
  for (const p of photoBytes) {
    parts.push({
      inlineData: {
        mimeType: p.mimeType || "image/jpeg",
        data: Buffer.from(p.data).toString("base64"),
      },
    });
  }
  parts.push({ text: userPrompt });

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  await prisma.draft.update({
    where: { id: draftId },
    data: { status: "GENERATING" },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = "";
      try {
        const result = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: SYSTEM_PROMPT + FULL_REVISE_SYSTEM_SUFFIX,
            temperature: 0.8,
          },
        });
        for await (const chunk of result) {
          const text = chunk.text;
          if (text) {
            accumulated += text;
            controller.enqueue(encoder.encode(text));
          }
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
            llmModel: "gemini-2.5-flash",
            llmProvider: "gemini",
          },
        });
        controller.close();
      } catch (e) {
        await prisma.draft
          .update({ where: { id: draftId }, data: { status: "FAILED" } })
          .catch(() => {});
        const msg = e instanceof Error ? e.message : "수정 실패";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
