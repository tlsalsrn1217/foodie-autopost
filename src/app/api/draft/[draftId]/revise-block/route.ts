import "server-only";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import {
  BLOCK_REVISE_SYSTEM,
  buildBlockRevisePrompt,
} from "@/lib/llm/prompts/revisePrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  blockText: z.string().min(1).max(4000),
  instruction: z.string().min(1).max(800),
  blockKind: z.enum(["h2", "p"]).optional(),
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
    return new Response("JSON parse 실패", { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response("유효하지 않은 입력", { status: 400 });
  }

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    select: { title: true, placeName: true, placeAddr: true },
  });
  if (!draft) return new Response("Not found", { status: 404 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("GEMINI_API_KEY 없음", { status: 500 });
  }

  const userPrompt = buildBlockRevisePrompt({
    blockText: parsed.data.blockText,
    instruction: parsed.data.instruction,
    blockKind: parsed.data.blockKind,
    contextTitle: draft.title,
    contextPlace: draft.placeName
      ? `${draft.placeName}${draft.placeAddr ? ` (${draft.placeAddr})` : ""}`
      : null,
  });

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: BLOCK_REVISE_SYSTEM,
            temperature: 0.7,
          },
        });
        for await (const chunk of result) {
          const text = chunk.text;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (e) {
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
