import matter from "gray-matter";

export type ReviewMeta = {
  summary: string | null;
  category: string | null;
  tags: string[];
};

export type ParsedReview = {
  meta: ReviewMeta;
  body: string;
  title: string | null;
};

export function extractTitle(body: string): string | null {
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function toStringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

// LLM이 가끔 출력 전체를 ```...``` 으로 감싸는 경우를 정리
function stripWrappingCodeFence(s: string): string {
  const t = s.trimStart();
  const fenceMatch = t.match(/^```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```\s*$/);
  if (fenceMatch) return fenceMatch[1];
  if (t.startsWith("```")) {
    const noOpen = t.replace(/^```[a-zA-Z]*\r?\n/, "");
    return noOpen.replace(/\r?\n```\s*$/, "");
  }
  return s;
}

export function parseReview(markdown: string): ParsedReview {
  const cleaned = stripWrappingCodeFence(markdown);
  try {
    const parsed = matter(cleaned);
    const data = parsed.data as Record<string, unknown>;
    const body = parsed.content.trimStart();
    return {
      meta: {
        summary: toStringOrNull(data.summary),
        category: toStringOrNull(data.category),
        tags: toStringArray(data.tags),
      },
      body,
      title: extractTitle(body),
    };
  } catch {
    return {
      meta: { summary: null, category: null, tags: [] },
      body: cleaned,
      title: extractTitle(cleaned),
    };
  }
}
