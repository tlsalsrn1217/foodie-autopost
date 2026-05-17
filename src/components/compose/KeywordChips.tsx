"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/Input";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
};

const SUGGESTIONS = [
  "분위기 좋음",
  "가성비",
  "재방문 의사",
  "데이트",
  "혼밥",
  "친절함",
  "줄서서 먹음",
  "주차 편함",
];

export function KeywordChips({ value, onChange, max = 10 }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const trimmed = raw.trim().slice(0, 20);
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (value.length >= max) return;
    onChange([...value, trimmed]);
    setDraft("");
  };

  const remove = (kw: string) => {
    onChange(value.filter((k) => k !== kw));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const unused = SUGGESTIONS.filter((s) => !value.includes(s));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface p-2 min-h-12">
        {value.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
          >
            {kw}
            <button
              type="button"
              onClick={() => remove(kw)}
              className="text-primary/60 hover:text-primary"
              aria-label={`${kw} 제거`}
            >
              ×
            </button>
          </span>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? "엔터로 키워드 추가" : ""}
          className="h-9 flex-1 min-w-32 border-0 bg-transparent px-1 focus-visible:ring-0"
          maxLength={20}
        />
      </div>

      {unused.length > 0 && value.length < max && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center mr-1">추천:</span>
          {unused.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
