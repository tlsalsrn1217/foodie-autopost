"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  DRAFTING: "초안",
  GENERATING: "생성 중",
  READY: "완성",
  PUBLISHED: "발행됨",
  FAILED: "실패",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFTING: "bg-muted text-muted-foreground",
  GENERATING: "bg-accent/15 text-accent",
  READY: "bg-primary/10 text-primary",
  PUBLISHED: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
};

function formatRelative(d: Date) {
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export type DraftCardData = {
  id: string;
  title: string | null;
  placeName: string | null;
  seoCategory: string | null;
  status: string;
  updatedAt: Date;
  coverUrl: string | undefined;
};

export function DraftCard({ draft }: { draft: DraftCardData }) {
  const router = useRouter();
  const displayTitle = draft.title ?? draft.placeName ?? "제목 없는 초안";
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting" | "error">(
    "idle",
  );

  const handleDelete = async () => {
    setStage("deleting");
    try {
      const res = await fetch(`/api/draft/${draft.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      router.refresh();
    } catch {
      setStage("error");
      setTimeout(() => setStage("idle"), 2000);
    }
  };

  const stopAndPrevent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <Link
        href={`/preview/${draft.id}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {draft.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.coverUrl}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              사진 없음
            </div>
          )}
          <span
            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[draft.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {STATUS_LABEL[draft.status] ?? draft.status}
          </span>
          {draft.seoCategory && (
            <span className="absolute top-2 right-10 rounded-full bg-foreground/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              {draft.seoCategory}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="font-semibold text-sm text-foreground line-clamp-2">
            {displayTitle}
          </div>
          {draft.placeName && draft.title && (
            <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
              {draft.placeName}
            </div>
          )}
          <div className="mt-auto pt-3 text-[11px] text-muted-foreground">
            {formatRelative(draft.updatedAt)}
          </div>
        </div>
      </Link>

      {/* 삭제 버튼 — Link 와 형제 요소로 분리해 Link 네비게이션과 충돌 X */}
      <button
        type="button"
        onClick={(e) => {
          stopAndPrevent(e);
          if (stage === "idle") setStage("confirm");
        }}
        className={cn(
          "absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface/90 text-muted-foreground backdrop-blur transition-colors",
          "hover:border-danger/40 hover:text-danger",
        )}
        aria-label="삭제"
        title="삭제"
      >
        <TrashIcon />
      </button>

      {/* 확인 오버레이 — 카드 전체 위에 떠서 의도치 않은 클릭 차단 */}
      {(stage === "confirm" || stage === "deleting" || stage === "error") && (
        <div
          onClick={stopAndPrevent}
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl p-4 text-center",
            "bg-surface/95 backdrop-blur-sm border border-danger/40",
          )}
        >
          {stage === "deleting" ? (
            <p className="text-sm text-muted-foreground">삭제 중…</p>
          ) : stage === "error" ? (
            <p className="text-sm text-danger">삭제 실패. 다시 시도해주세요.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                정말 삭제할까요?
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {displayTitle}
              </p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    stopAndPrevent(e);
                    setStage("idle");
                  }}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    stopAndPrevent(e);
                    handleDelete();
                  }}
                  className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
