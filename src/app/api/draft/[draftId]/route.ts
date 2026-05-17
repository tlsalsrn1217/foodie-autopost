import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  reviewBody: z.string().optional(),
  reviewMarkdown: z.string().optional(),
  seoSummary: z.string().nullable().optional(),
  seoCategory: z.string().nullable().optional(),
  seoTags: z.array(z.string()).optional(),
  status: z.enum(["DRAFTING", "GENERATING", "READY", "PUBLISHED", "FAILED"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function buildMarkdown({
  frontmatter,
  title,
  body,
}: {
  frontmatter: string | null;
  title: string | null;
  body: string;
}): string {
  const parts: string[] = [];
  if (frontmatter) parts.push(frontmatter.trimEnd());
  if (title) parts.push(`# ${title.trim()}`);
  parts.push(body.trim());
  return parts.filter(Boolean).join("\n\n") + "\n";
}

function extractFrontmatter(md: string | null | undefined): string | null {
  if (!md) return null;
  const m = md.match(FRONTMATTER_RE);
  return m ? m[0].trimEnd() : null;
}

export async function PATCH(
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "유효하지 않은 입력", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // reviewBody 만 들어온 경우: 현재 frontmatter + title 과 머지해서 reviewMarkdown 재구성
  let computedMarkdown: string | undefined;
  if (data.reviewBody !== undefined) {
    const current = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { reviewMarkdown: true, title: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const frontmatter = extractFrontmatter(current.reviewMarkdown);
    const title = data.title ?? current.title ?? null;
    computedMarkdown = buildMarkdown({
      frontmatter,
      title,
      body: data.reviewBody,
    });
  }

  try {
    const updated = await prisma.draft.update({
      where: { id: draftId },
      data: {
        title: data.title,
        reviewMarkdown:
          computedMarkdown ?? data.reviewMarkdown ?? undefined,
        seoSummary: data.seoSummary,
        seoCategory: data.seoCategory,
        seoTags: data.seoTags,
        status: data.status,
        publishedAt:
          data.publishedAt === undefined
            ? undefined
            : data.publishedAt
              ? new Date(data.publishedAt)
              : null,
      },
      select: { id: true, title: true, status: true, publishedAt: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "업데이트 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
