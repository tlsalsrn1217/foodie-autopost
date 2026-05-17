"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  draftId: string;
  initialTitle: string | null;
  liveTitle?: string | null;
  onTitleChange?: (title: string) => void;
};

export function TitleEditor({
  draftId,
  initialTitle,
  liveTitle,
  onTitleChange,
}: Props) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [savedTitle, setSavedTitle] = useState(initialTitle ?? "");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 본문 스트리밍 중 새 제목이 들어오면, 사용자가 손대지 않았을 때만 동기화
  useEffect(() => {
    if (!liveTitle) return;
    if (title === savedTitle) {
      setTitle(liveTitle);
      setSavedTitle(liveTitle);
    }
  }, [liveTitle, title, savedTitle]);

  // 현재 제목을 외부로 알려서 본문 복사 시 합성에 쓸 수 있도록
  useEffect(() => {
    onTitleChange?.(title);
  }, [title, onTitleChange]);

  const persist = async (next: string) => {
    if (!next.trim()) return;
    if (next === savedTitle) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/draft/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next.trim() }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSavedTitle(next.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleInput = (v: string) => {
    setTitle(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(v), 600);
  };

  const suggest = async () => {
    setLoadingSuggestions(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/generate/${draftId}/title`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("추천 실패");
      const data = (await res.json()) as { candidates: string[] };
      setSuggestions(data.candidates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "추천 실패");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (s: string) => {
    setTitle(s);
    setSuggestions([]);
    persist(s);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">
          제목
        </label>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {saving && <span>저장 중…</span>}
          {!saving && title === savedTitle && savedTitle && (
            <span className="text-success">저장됨</span>
          )}
          <button
            type="button"
            onClick={suggest}
            disabled={loadingSuggestions}
            className={cn(
              "rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium hover:bg-muted",
              loadingSuggestions && "opacity-50 cursor-wait",
            )}
          >
            {loadingSuggestions ? "추천 중…" : "AI 제목 추천"}
          </button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={() => persist(title)}
        placeholder="제목을 입력하거나 'AI 제목 추천' 버튼을 눌러보세요"
        className={cn(
          "w-full rounded-md border border-border bg-surface px-4 py-3 text-lg font-bold tracking-tight",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
        )}
        maxLength={120}
      />

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1">
            추천 제목 — 마음에 드는 걸 골라주세요
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applySuggestion(s)}
              className="block w-full rounded-md bg-surface border border-border px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSuggestions([])}
            className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            닫기
          </button>
        </div>
      )}
    </section>
  );
}
