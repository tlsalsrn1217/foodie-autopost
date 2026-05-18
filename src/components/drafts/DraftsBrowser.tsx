"use client";

import { useMemo, useState } from "react";
import { DraftCard, type DraftCardData } from "./DraftCard";
import { cn } from "@/lib/utils";

type DraftItem = DraftCardData & {
  // (no extras for now — same shape)
};

type Props = {
  drafts: DraftItem[];
};

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "READY", label: "완성" },
  { value: "PUBLISHED", label: "발행됨" },
  { value: "DRAFTING", label: "초안" },
  { value: "GENERATING", label: "생성 중" },
  { value: "FAILED", label: "실패" },
];

type ViewMode = "folder" | "grid";

export function DraftsBrowser({ drafts }: Props) {
  const [status, setStatus] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [view, setView] = useState<ViewMode>("folder");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts.filter((d) => {
      if (status !== "ALL" && d.status !== status) return false;
      if (q) {
        const hay = `${d.title ?? ""} ${d.placeName ?? ""} ${d.seoCategory ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drafts, status, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, DraftItem[]>();
    for (const d of filtered) {
      const key = d.seoCategory?.trim() || "미분류";
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "미분류") return 1;
      if (b[0] === "미분류") return -1;
      return b[1].length - a[1].length;
    });
  }, [filtered]);

  const totalAll = drafts.length;
  const totalFiltered = filtered.length;

  return (
    <div className="space-y-5">
      {/* 검색 + 보기 토글 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·가게·카테고리로 검색"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5 text-xs self-start">
          <button
            type="button"
            onClick={() => setView("folder")}
            className={cn(
              "rounded-sm px-3 py-1.5 font-medium transition-colors",
              view === "folder"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            카테고리별
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-sm px-3 py-1.5 font-medium transition-colors",
              view === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            전체 그리드
          </button>
        </div>
      </div>

      {/* 상태 필터 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === "ALL"
              ? totalAll
              : drafts.filter((d) => d.status === f.value).length;
          const active = status === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn("tabular-nums", active ? "opacity-90" : "opacity-60")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 결과 카운트 */}
      <div className="text-xs text-muted-foreground">
        {totalFiltered}편 표시 / 전체 {totalAll}편
      </div>

      {/* 본문 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            조건에 맞는 리뷰가 없어요
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            필터를 바꾸거나 검색어를 지워보세요
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DraftCard key={d.id} draft={d} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <CategoryFolder
              key={category}
              category={category}
              items={items}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryFolder({
  category,
  items,
}: {
  category: string;
  items: DraftItem[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-border bg-surface/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40 rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "text-muted-foreground transition-transform",
              open ? "rotate-90" : "",
            )}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-sm font-semibold text-foreground">{category}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
            {items.length}
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-border/60 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <DraftCard key={d.id} draft={d} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
