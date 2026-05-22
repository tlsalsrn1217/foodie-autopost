"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { DraftCardData } from "./DraftCard";

type DraftItem = DraftCardData & {
  region: string;
};

type Props = {
  drafts: DraftItem[];
};

type ColumnKey = "DRAFTING" | "READY" | "SCHEDULED" | "PUBLISHED";

const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  hint: string;
  // 어떤 status 들이 이 컬럼에 속하는지
  match: (status: string) => boolean;
}> = [
  {
    key: "DRAFTING",
    label: "초안 작성 중",
    hint: "사진·메모 입력 완료, AI 생성 전",
    match: (s) => s === "DRAFTING" || s === "GENERATING" || s === "FAILED",
  },
  {
    key: "READY",
    label: "AI 생성 완료",
    hint: "검토·편집 단계",
    match: (s) => s === "READY",
  },
  {
    key: "SCHEDULED",
    label: "발행 예약됨",
    hint: "발행 직전 대기",
    match: (s) => s === "SCHEDULED",
  },
  {
    key: "PUBLISHED",
    label: "발행 완료",
    hint: "네이버 블로그에 게시 완료",
    match: (s) => s === "PUBLISHED",
  },
];

export function KanbanBoard({ drafts }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<DraftItem[]>(drafts);
  const [query, setQuery] = useState("");

  useEffect(() => setItems(drafts), [drafts]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter((d) =>
          `${d.title ?? ""} ${d.placeName ?? ""} ${d.seoCategory ?? ""} ${d.region}`
            .toLowerCase()
            .includes(q),
        )
      : items;
    const map: Record<ColumnKey, DraftItem[]> = {
      DRAFTING: [],
      READY: [],
      SCHEDULED: [],
      PUBLISHED: [],
    };
    for (const d of filtered) {
      const col = COLUMNS.find((c) => c.match(d.status));
      if (col) map[col.key].push(d);
    }
    return map;
  }, [items, query]);

  const moveCard = async (draftId: string, target: ColumnKey) => {
    // 즉시 화면 반영
    setItems((current) =>
      current.map((d) => (d.id === draftId ? { ...d, status: target } : d)),
    );

    // 서버 동기화
    try {
      const body: Record<string, unknown> = { status: target };
      if (target === "PUBLISHED") {
        body.publishedAt = new Date().toISOString();
      } else if (target === "SCHEDULED" || target === "READY") {
        body.publishedAt = null;
      }
      const res = await fetch(`/api/draft/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("상태 저장 실패");
      router.refresh();
    } catch {
      // 실패 시 원래 상태로 복구
      setItems(drafts);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const targetCol = e.over?.id as ColumnKey | undefined;
    const draftId = String(e.active.id);
    if (!targetCol) return;
    const current = items.find((d) => d.id === draftId);
    if (!current) return;
    const currentCol = COLUMNS.find((c) => c.match(current.status))?.key;
    if (currentCol === targetCol) return;
    moveCard(draftId, targetCol);
  };

  return (
    <div className="space-y-4">
      {/* 상단 컨트롤 */}
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
        <p className="text-[11px] text-muted-foreground text-left">
          카드를 드래그해서 다른 컬럼으로 옮기면 상태가 자동 저장됩니다.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <Column key={col.key} col={col} items={grouped[col.key]} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Column({
  col,
  items,
}: {
  col: (typeof COLUMNS)[number];
  items: DraftItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[300px] flex-col rounded-xl border border-border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      <header className="mb-3 text-left">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{col.hint}</p>
      </header>

      <div className="flex-1 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-surface/40 px-3 py-6 text-center text-[10px] text-muted-foreground">
            카드를 여기로 드래그
          </div>
        ) : (
          items.map((d) => <KanbanCard key={d.id} draft={d} />)
        )}
      </div>
    </section>
  );
}

function KanbanCard({ draft }: { draft: DraftItem }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({ id: draft.id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    touchAction: "none",
  };

  const displayTitle = draft.title ?? draft.placeName ?? "제목 없는 초안";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border border-border bg-surface shadow-soft transition-shadow",
        isDragging && "opacity-50 shadow-lift z-10",
      )}
    >
      {/* 드래그 핸들 — 카드 전체 */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing select-none p-3 text-left"
      >
        {draft.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.coverUrl}
            alt=""
            className="mb-2 aspect-[16/10] w-full rounded-sm object-cover"
            draggable={false}
          />
        )}
        <div className="text-xs font-semibold text-foreground line-clamp-2 text-left">
          {displayTitle}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {draft.seoCategory && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
              {draft.seoCategory}
            </span>
          )}
          {draft.region && draft.region !== "미지정" && (
            <span>{draft.region}</span>
          )}
        </div>
      </div>

      {/* 우상단 상세 보기 링크 — 드래그 영역과 분리 */}
      <Link
        href={`/preview/${draft.id}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 rounded-full bg-surface/95 border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-primary hover:border-primary"
      >
        열기 →
      </Link>
    </div>
  );
}
