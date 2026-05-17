"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlockEditor } from "./BlockEditor";
import { naverFriendlyHtml } from "@/lib/markdown/toHtml";

type PhotoRef = {
  order: number;
  publicUrl: string;
};

type LiveMeta = {
  summary: string | null;
  category: string | null;
  tags: string[];
  title: string | null;
};

type Props = {
  draftId: string;
  initialMarkdown: string | null;
  initialStatus: string;
  photos: PhotoRef[];
  currentTitle?: string | null;
  autoStart?: boolean;
  onMetaChange?: (meta: LiveMeta) => void;
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripWrappingFence(md: string): string {
  const t = md.trimStart();
  if (!t.startsWith("```")) return md;
  let s = t.replace(/^```[a-zA-Z]*\r?\n/, "");
  s = s.replace(/\r?\n```\s*$/, "");
  return s;
}

function stripFrontmatter(md: string): string {
  return stripWrappingFence(md).replace(FRONTMATTER_RE, "").trimStart();
}

function stripFirstH1(body: string): string {
  return body.replace(/^\s*#\s+.+?\r?\n/, "").trimStart();
}

function extractFirstH1(body: string): string | null {
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function parseLiveMeta(md: string): LiveMeta {
  const cleaned = stripWrappingFence(md);
  const bodyForTitle = cleaned.replace(FRONTMATTER_RE, "").trimStart();
  const title = extractFirstH1(bodyForTitle);
  const match = cleaned.match(FRONTMATTER_RE);
  if (!match) return { summary: null, category: null, tags: [], title };
  const body = match[1];
  const summaryMatch = body.match(/^summary:\s*"([^"]*)"/m);
  const categoryMatch = body.match(/^category:\s*"([^"]*)"/m);
  const tags: string[] = [];
  const tagBlockMatch = body.match(/^tags:\s*\n([\s\S]*?)(?=^\S|\Z)/m);
  if (tagBlockMatch) {
    for (const line of tagBlockMatch[1].split(/\r?\n/)) {
      const t = line.match(/^\s*-\s*"([^"]+)"/);
      if (t) tags.push(t[1]);
    }
  }
  return {
    summary: summaryMatch?.[1] ?? null,
    category: categoryMatch?.[1] ?? null,
    tags,
    title,
  };
}

// 마커: 신버전 [이미지 N], 구버전 [PHOTO_N] 둘 다 인식
const PHOTO_MARKER_RE = /\[(?:이미지\s*|PHOTO_)(\d+)\]/g;

function substitutePhotos(markdown: string, photos: PhotoRef[]): string {
  const byNumber = new Map<number, string>();
  for (const p of photos) byNumber.set(p.order + 1, p.publicUrl);

  return markdown.replace(PHOTO_MARKER_RE, (_, n: string) => {
    const url = byNumber.get(Number(n));
    if (!url) return "";
    return `\n\n![사진 ${n}](${url})\n\n`;
  });
}

// 복사용 — 사진 자리에 사람이 알아볼 자리표시자만 남김 (네이버 SmartEditor 붙여넣기 흐름용)
function substitutePhotosAsPlaceholder(markdown: string): string {
  return markdown.replace(
    PHOTO_MARKER_RE,
    (_, n: string) => `\n\n[사진 ${n}을 넣어주세요]\n\n`,
  );
}

export function ReviewSection({
  draftId,
  initialMarkdown,
  initialStatus,
  photos,
  currentTitle,
  autoStart = true,
  onMetaChange,
}: Props) {
  const [markdown, setMarkdown] = useState(initialMarkdown ?? "");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  const bodyNoFm = useMemo(() => stripFrontmatter(markdown), [markdown]);
  const bodyNoTitle = useMemo(() => stripFirstH1(bodyNoFm), [bodyNoFm]);
  const rendered = useMemo(
    () => substitutePhotos(bodyNoTitle, photos),
    [bodyNoTitle, photos],
  );

  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const copyMarkdown = async () => {
    const headerTitle = currentTitle?.trim() || "리뷰";
    const plainMarkdown = `# ${headerTitle}\n\n${substitutePhotosAsPlaceholder(bodyNoTitle)}`;
    const html = naverFriendlyHtml(plainMarkdown);
    try {
      // text/plain + text/html 둘 다 — 네이버 SmartEditor는 HTML 쪽을 잡아 렌더
      if (typeof ClipboardItem !== "undefined") {
        const item = new ClipboardItem({
          "text/plain": new Blob([plainMarkdown], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plainMarkdown);
      }
      setCopyState("done");
    } catch {
      // 일부 브라우저는 text/html 쓰는 게 실패할 수 있음 — 텍스트로 폴백
      try {
        await navigator.clipboard.writeText(plainMarkdown);
        setCopyState("done");
      } catch {
        setCopyState("error");
      }
    }
    setTimeout(() => setCopyState("idle"), 2400);
  };

  useEffect(() => {
    if (!onMetaChange) return;
    onMetaChange(parseLiveMeta(markdown));
  }, [markdown, onMetaChange]);

  const generate = useCallback(async () => {
    if (streaming) return;
    setError(null);
    setStreaming(true);
    setMarkdown("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/generate/${draftId}`, {
        method: "POST",
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`생성 요청 실패 (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        setMarkdown(buffer);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [draftId, streaming]);

  useEffect(() => {
    if (!autoStart) return;
    if (startedRef.current) return;
    if (initialMarkdown) return;
    if (initialStatus === "GENERATING") return;
    startedRef.current = true;
    generate();
  }, [autoStart, initialMarkdown, initialStatus, generate]);

  const stop = () => abortRef.current?.abort();

  const isEmpty = !markdown && !streaming;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">AI 리뷰</h2>
        <div className="flex items-center gap-2">
          {streaming && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              생성 중...
            </span>
          )}
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
            >
              중지
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover shadow-soft"
            >
              {markdown ? "다시 생성" : "생성하기"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-center text-sm text-muted-foreground py-8">
            우측 상단의 "생성하기"를 눌러 AI 리뷰를 만들어보세요.
          </div>
        </div>
      ) : streaming ? (
        <article
          className={
            "rounded-xl border border-border bg-surface p-6 prose prose-sm max-w-none " +
            "prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed " +
            "prose-h1:text-2xl prose-h2:text-lg " +
            "prose-img:rounded-lg prose-img:my-4 prose-img:shadow-soft"
          }
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
        </article>
      ) : (
        <BlockEditor draftId={draftId} body={bodyNoTitle} photos={photos} />
      )}

      {markdown && !streaming && (
        <div className="space-y-2">
          {copyState === "done" && (
            <div className="rounded-md border border-success/40 bg-success/10 px-4 py-3 flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-semibold text-foreground">
                  본문이 클립보드에 복사됐어요
                </div>
                <div className="mt-0.5 text-muted-foreground leading-relaxed">
                  네이버 블로그에 붙여넣은 다음, <span className="font-medium text-foreground">[사진 N을 넣어주세요]</span> 자리마다 본문의 사진 카드에서 <span className="font-medium text-foreground">"사진 복사"</span> → Ctrl+V 로 끼워넣어주세요.
                </div>
              </div>
            </div>
          )}
          {copyState === "error" && (
            <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-2 text-xs text-danger">
              클립보드 복사에 실패했어요. 브라우저 권한을 확인해주세요.
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
              title="제목·본문·자리표시자([사진 N을 넣어주세요]) 까지 클립보드로 복사"
            >
              마크다운 복사 (사진 자리는 표시자)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
