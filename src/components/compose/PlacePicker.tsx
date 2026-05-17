"use client";

import { useState } from "react";
import type { Place } from "@/types/place";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Props = {
  value: Place | undefined;
  onChange: (place: Place | undefined) => void;
};

export function PlacePicker({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { places: Place[] };
      setResults(data.places ?? []);
    } catch (e) {
      setError("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{value.name}</div>
          <div className="text-sm text-muted-foreground">
            {value.roadAddress ?? value.address}
          </div>
          {value.category && (
            <div className="text-xs text-muted-foreground">{value.category}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-sm text-muted-foreground hover:text-primary shrink-0"
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="가게 이름 또는 위치 (예: 합정 칼국수)"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none shadow-soft"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border bg-surface overflow-hidden">
          {results.map((place, i) => (
            <li key={`${place.name}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(place);
                  setResults([]);
                  setQuery("");
                }}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-muted transition-colors",
                  "flex flex-col gap-1",
                )}
              >
                <span className="font-medium text-foreground">{place.name}</span>
                <span className="text-sm text-muted-foreground">
                  {place.roadAddress ?? place.address}
                </span>
                {place.category && (
                  <span className="text-xs text-muted-foreground">
                    {place.category}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        선택하지 않아도 글은 작성할 수 있어요. (장소 정보를 넣으면 지도가 함께 들어갑니다)
      </p>
    </div>
  );
}
