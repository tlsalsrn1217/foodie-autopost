import "server-only";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `당신은 네이버 블로그 검색 노출에 능숙한 음식 블로거입니다.
주어진 본문/장소/키워드를 바탕으로 클릭하고 싶어지면서도 과장 없는 솔직한 톤의 제목을 5개 제안합니다.

규칙:
- 각 제목은 30~40자 (한글 기준).
- 가게명·지역명·핵심 음식 카테고리 중 최소 두 개를 자연스럽게 포함.
- 클릭베이트("충격", "이걸 모르면 손해") 금지. 별점/이모지/해시태그 금지.
- 후보들은 톤이 살짝씩 달라야 합니다 (예: 정보형 / 감성형 / 솔직후기형).

출력 형식 (꼭 지킬 것):
- 줄마다 제목 하나, 번호나 마크다운 없이 plain text.
- 정확히 5줄.`;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ draftId: string }> },
) {
  const { draftId } = await ctx.params;

  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 없음" },
      { status: 500 },
    );
  }

  const parts: string[] = [];
  if (draft.placeName) {
    parts.push(`가게: ${draft.placeName}`);
    if (draft.placeAddr) parts.push(`주소: ${draft.placeAddr}`);
  }
  if (draft.keywords.length) {
    parts.push(`키워드: ${draft.keywords.join(", ")}`);
  }
  if (draft.mood) parts.push(`방문 인상: ${draft.mood}`);
  if (draft.reviewMarkdown) {
    const bodyOnly = draft.reviewMarkdown
      .replace(/^---[\s\S]*?---\s*/, "")
      .replace(/\[(?:이미지\s*|PHOTO_)\d+\]/g, "")
      .slice(0, 1500);
    parts.push(`본문 일부:\n${bodyOnly}`);
  }

  const userPrompt = parts.join("\n\n") + "\n\n위 정보를 바탕으로 제목 5개 제안해주세요.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: { systemInstruction: SYSTEM, temperature: 0.9 },
    });

    const text = res.text ?? "";
    const candidates = text
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^\d+[.)]\s*/, "").replace(/^[-*•]\s*/, ""))
      .filter(Boolean)
      .slice(0, 5);

    return NextResponse.json({ candidates });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "제목 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
