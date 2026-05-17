"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { parseBlocks, serializeBlocks, type Block } from "@/lib/markdown/blocks";
import { cn } from "@/lib/utils";

type PhotoRef = {
  order: number;
  publicUrl: string;
};

type Props = {
  draftId: string;
  body: string;
  photos: PhotoRef[];
};

type BlockEditUI = {
  instruction: string;
  streaming: boolean;
  previewText: string;
  error: string | null;
};

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M5 19l3.5-3.5M15.5 8.5L19 5" />
    </svg>
  );
}

async function copyImageToClipboard(url: string): Promise<void> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`사진 다운로드 실패 (${res.status})`);
  const blob = await res.blob();

  // 클립보드는 image/png 가장 안정적. 다른 포맷이면 PNG로 변환.
  let finalBlob: Blob = blob;
  if (blob.type !== "image/png") {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas context 생성 실패");
    ctx.drawImage(bitmap, 0, 0);
    finalBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG 변환 실패"))),
        "image/png",
      ),
    );
  }

  await navigator.clipboard.write([
    new ClipboardItem({ [finalBlob.type]: finalBlob }),
  ]);
}

function PhotoBlock({
  block,
  photoUrl,
}: {
  block: Extract<Block, { kind: "photo" }>;
  photoUrl: string | undefined;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "error">(
    "idle",
  );

  const handleCopyImage = async () => {
    if (!photoUrl) return;
    setCopyState("copying");
    try {
      await copyImageToClipboard(photoUrl);
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2200);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-primary/30 bg-primary/5">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`사진 ${block.photoNumber}`}
          className="w-full max-h-[520px] object-contain bg-black/5"
        />
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          사진 {block.photoNumber} 을 찾을 수 없어요
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-primary/5 border-t border-primary/20">
        <span className="text-[10px] text-muted-foreground">
          사진 {block.photoNumber} · 드래그로 위치 이동
        </span>
        {photoUrl && (
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={copyState === "copying"}
            className={cn(
              "rounded-md border border-border bg-surface px-2 py-0.5 text-[10px]",
              "hover:border-primary hover:text-primary transition-colors",
              copyState === "done" && "border-success text-success bg-success/10",
              copyState === "error" && "border-danger text-danger",
            )}
          >
            {copyState === "copying" && "복사 중…"}
            {copyState === "done" && "✓ 복사됨"}
            {copyState === "error" && "실패"}
            {copyState === "idle" && "사진 복사"}
          </button>
        )}
      </div>
    </div>
  );
}

function BlockContent({
  block,
  photoUrl,
}: {
  block: Block;
  photoUrl: string | undefined;
}) {
  if (block.kind === "h1") {
    return <h1 className="text-2xl font-bold tracking-tight my-4">{block.text}</h1>;
  }
  if (block.kind === "h2") {
    return (
      <h2 className="text-lg font-bold tracking-tight mt-6 mb-2">{block.text}</h2>
    );
  }
  if (block.kind === "photo") {
    return <PhotoBlock block={block} photoUrl={photoUrl} />;
  }
  return (
    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-3 prose-strong:font-semibold">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
    </div>
  );
}

function SortableBlock({
  block,
  photoUrl,
  isEditing,
  editUI,
  onStartEdit,
  onCancelEdit,
  onInstructionChange,
  onApplyEdit,
  onKeepEdit,
  onResetEdit,
}: {
  block: Block;
  photoUrl: string | undefined;
  isEditing: boolean;
  editUI: BlockEditUI | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onInstructionChange: (v: string) => void;
  onApplyEdit: () => void;
  onKeepEdit: () => void;
  onResetEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canEdit = block.kind === "p" || block.kind === "h2";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md transition-colors px-3 -mx-3",
        "hover:bg-muted/40",
        isEditing && "bg-primary/5 ring-1 ring-primary/20",
        isDragging && "opacity-50 z-10",
      )}
    >
      {/* 좌측 드래그 핸들 */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-4 top-1.5 hidden sm:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing",
          block.kind === "photo" && "opacity-60",
        )}
        aria-label="블럭 이동"
      >
        <GripIcon />
      </button>

      {/* 우측 AI 수정 버튼 */}
      {canEdit && !isEditing && (
        <button
          type="button"
          onClick={onStartEdit}
          className={cn(
            "absolute right-2 top-1.5 hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-muted-foreground",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:border-primary hover:text-primary",
          )}
        >
          <SparkleIcon />
          AI 수정
        </button>
      )}

      <BlockContent block={block} photoUrl={photoUrl} />

      {/* 편집 패널 */}
      {canEdit && isEditing && editUI && (
        <div className="mt-2 rounded-md border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary">
              AI 수정 — 이 {block.kind === "h2" ? "소제목" : "단락"}만
            </span>
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              닫기
            </button>
          </div>

          <textarea
            value={editUI.instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            placeholder="예: 좀 더 짧고 담백하게 / 음식의 맛 묘사를 더 디테일하게 / 친구와 갔던 분위기를 살려서"
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={editUI.streaming}
          />

          {editUI.previewText && (
            <div className="rounded-md border border-accent/40 bg-surface p-3 text-sm">
              <div className="text-[10px] font-semibold text-accent mb-1">
                미리보기 {editUI.streaming && "(생성 중...)"}
              </div>
              <div className="prose prose-sm max-w-none prose-p:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editUI.previewText}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {editUI.error && (
            <p className="text-xs text-danger">{editUI.error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            {!editUI.previewText && (
              <button
                type="button"
                onClick={onApplyEdit}
                disabled={editUI.streaming || !editUI.instruction.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover shadow-soft disabled:opacity-50"
              >
                {editUI.streaming ? "생성 중..." : "수정 적용"}
              </button>
            )}
            {editUI.previewText && !editUI.streaming && (
              <>
                <button
                  type="button"
                  onClick={onResetEdit}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
                >
                  다시 작성
                </button>
                <button
                  type="button"
                  onClick={onKeepEdit}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover shadow-soft"
                >
                  이대로 교체
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BlockEditor({ draftId, body, photos }: Props) {
  const router = useRouter();

  const photoUrlMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of photos) m.set(p.order + 1, p.publicUrl);
    return m;
  }, [photos]);

  const initialBlocks = useMemo(() => parseBlocks(body), [body]);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string>(serializeBlocks(initialBlocks));

  // Block-level edit state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockEditUI, setBlockEditUI] = useState<BlockEditUI | null>(null);
  const blockAbortRef = useRef<AbortController | null>(null);

  // Global revise state
  const [globalInstruction, setGlobalInstruction] = useState("");
  const [globalUI, setGlobalUI] = useState<{
    streaming: boolean;
    text: string;
    error: string | null;
    completed: boolean;
  } | null>(null);
  const globalAbortRef = useRef<AbortController | null>(null);

  // body prop이 바뀌면 (예: 전체 재생성 후 router.refresh) 블럭 다시 파싱
  useEffect(() => {
    const next = parseBlocks(body);
    setBlocks(next);
    lastSerializedRef.current = serializeBlocks(next);
    setSaveState("idle");
    setEditingBlockId(null);
    setBlockEditUI(null);
    setGlobalUI(null);
  }, [body]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistBlocks = useCallback(
    async (next: Block[]) => {
      const serialized = serializeBlocks(next);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/draft/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewBody: serialized }),
        });
        if (!res.ok) throw new Error("저장 실패");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [draftId],
  );

  const queueSave = useCallback(
    (next: Block[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistBlocks(next), 500);
    },
    [persistBlocks],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setBlocks((current) => {
        const oldIndex = current.findIndex((b) => b.id === active.id);
        const newIndex = current.findIndex((b) => b.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return current;
        const next = arrayMove(current, oldIndex, newIndex);
        queueSave(next);
        return next;
      });
    },
    [queueSave],
  );

  // ---- Block-level AI edit ----
  const startBlockEdit = (blockId: string) => {
    blockAbortRef.current?.abort();
    setEditingBlockId(blockId);
    setBlockEditUI({
      instruction: "",
      streaming: false,
      previewText: "",
      error: null,
    });
  };

  const cancelBlockEdit = () => {
    blockAbortRef.current?.abort();
    setEditingBlockId(null);
    setBlockEditUI(null);
  };

  const resetBlockEdit = () => {
    setBlockEditUI((s) => (s ? { ...s, previewText: "", error: null } : s));
  };

  const applyBlockEdit = async () => {
    if (!editingBlockId || !blockEditUI) return;
    const block = blocks.find((b) => b.id === editingBlockId);
    if (!block || (block.kind !== "p" && block.kind !== "h2")) return;

    const ctrl = new AbortController();
    blockAbortRef.current = ctrl;
    setBlockEditUI({
      instruction: blockEditUI.instruction,
      streaming: true,
      previewText: "",
      error: null,
    });

    try {
      const res = await fetch(`/api/draft/${draftId}/revise-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockText: block.text,
          instruction: blockEditUI.instruction,
          blockKind: block.kind,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`수정 실패 (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setBlockEditUI((s) => (s ? { ...s, previewText: buf } : s));
      }
      setBlockEditUI((s) => (s ? { ...s, streaming: false } : s));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setBlockEditUI((s) =>
        s
          ? {
              ...s,
              streaming: false,
              error: e instanceof Error ? e.message : "수정 실패",
            }
          : s,
      );
    }
  };

  const keepBlockEdit = () => {
    if (!editingBlockId || !blockEditUI?.previewText) return;
    const newText = blockEditUI.previewText.trim();
    setBlocks((current) => {
      const idx = current.findIndex((b) => b.id === editingBlockId);
      if (idx < 0) return current;
      const updated = [...current];
      const target = updated[idx];
      if (target.kind === "h2") {
        // 헤딩의 경우 결과 텍스트 맨 앞 ## 가 있으면 제거
        updated[idx] = { ...target, text: newText.replace(/^##\s+/, "") };
      } else if (target.kind === "p") {
        updated[idx] = { ...target, text: newText };
      }
      queueSave(updated);
      return updated;
    });
    setEditingBlockId(null);
    setBlockEditUI(null);
  };

  // ---- Global revise ----
  const startGlobalRevise = async () => {
    if (!globalInstruction.trim()) return;
    globalAbortRef.current?.abort();
    const ctrl = new AbortController();
    globalAbortRef.current = ctrl;
    setGlobalUI({ streaming: true, text: "", error: null, completed: false });

    try {
      const res = await fetch(`/api/draft/${draftId}/revise-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: globalInstruction }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`수정 실패 (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setGlobalUI({ streaming: true, text: buf, error: null, completed: false });
      }
      // 스트림 완료 — 사용자에게 명시적으로 안내, "확인" 누르면 새로고침
      setGlobalUI({ streaming: false, text: buf, error: null, completed: true });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setGlobalUI({
        streaming: false,
        text: globalUI?.text ?? "",
        error: e instanceof Error ? e.message : "수정 실패",
        completed: false,
      });
    }
  };

  const acknowledgeGlobalRevise = () => {
    setGlobalUI(null);
    setGlobalInstruction("");
    router.refresh();
  };

  const cancelGlobalRevise = () => {
    globalAbortRef.current?.abort();
    setGlobalUI(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-muted-foreground">
            블럭을 드래그하거나 "AI 수정"으로 단락을 다듬어보세요
          </span>
          <span className="text-[10px] text-muted-foreground">
            {saveState === "saving" && "저장 중…"}
            {saveState === "saved" && <span className="text-success">저장됨</span>}
            {saveState === "error" && <span className="text-danger">저장 실패</span>}
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="pl-1 sm:pl-0 sm:pr-2">
              {blocks.map((b) => (
                <SortableBlock
                  key={b.id}
                  block={b}
                  photoUrl={
                    b.kind === "photo" ? photoUrlMap.get(b.photoNumber) : undefined
                  }
                  isEditing={editingBlockId === b.id}
                  editUI={editingBlockId === b.id ? blockEditUI : null}
                  onStartEdit={() => startBlockEdit(b.id)}
                  onCancelEdit={cancelBlockEdit}
                  onInstructionChange={(v) =>
                    setBlockEditUI((s) => (s ? { ...s, instruction: v } : s))
                  }
                  onApplyEdit={applyBlockEdit}
                  onKeepEdit={keepBlockEdit}
                  onResetEdit={resetBlockEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* 전체 수정 패널 */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">전체 글 AI 수정</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              톤·길이·디테일 등 전체 글에 일관되게 적용할 변경 사항을 적어주세요.
            </div>
          </div>
        </div>

        <textarea
          value={globalInstruction}
          onChange={(e) => setGlobalInstruction(e.target.value)}
          placeholder="예: 좀 더 친근한 톤으로 / 가격 정보를 더 강조해서 / 데이트 분위기를 더 살려서 / 본문 길이를 줄여서"
          rows={3}
          disabled={globalUI?.streaming}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {globalUI?.completed && (
          <div className="rounded-md border border-success/40 bg-success/10 px-4 py-3 flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">
                전체 글이 새 버전으로 교체됐어요
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                서버에 자동 저장됐습니다. "확인하기"를 누르면 본문이 새 버전으로 갱신돼요.
              </div>
            </div>
            <button
              type="button"
              onClick={acknowledgeGlobalRevise}
              className="shrink-0 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              확인하기
            </button>
          </div>
        )}

        {globalUI && !globalUI.completed && (
          <div className="rounded-md border border-primary/40 bg-surface p-3 max-h-72 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
            <div className="mb-2 flex items-center justify-between sticky top-0 bg-surface/95 pb-1">
              <span className="text-[10px] font-semibold text-primary">
                {globalUI.streaming ? "재작성 중…" : "재작성 완료"}
              </span>
              {!globalUI.streaming && (
                <button
                  type="button"
                  onClick={cancelGlobalRevise}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  닫기
                </button>
              )}
            </div>
            <div>{globalUI.text}</div>
          </div>
        )}

        {globalUI?.error && (
          <p className="text-xs text-danger">{globalUI.error}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          {globalUI?.streaming ? (
            <button
              type="button"
              onClick={cancelGlobalRevise}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
            >
              중지
            </button>
          ) : !globalUI?.completed ? (
            <button
              type="button"
              onClick={startGlobalRevise}
              disabled={!globalInstruction.trim()}
              className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent-hover shadow-soft disabled:opacity-50"
            >
              전체에 적용
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
