"use client";

import { Textarea } from "@/components/ui/Textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
};

export function MoodInput({ value, onChange, maxLength = 500 }: Props) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder="예) 비 오는 날 따뜻한 칼국수 한 그릇 — 면이 쫄깃하고 국물이 진해서 마음까지 풀렸어요."
      />
      <div className="flex justify-end text-xs text-muted-foreground">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
