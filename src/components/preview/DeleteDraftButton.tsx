"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  draftId: string;
  title: string | null;
  placeName: string | null;
};

export function DeleteDraftButton({ draftId, title, placeName }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const displayName = title ?? placeName ?? "이 글";

  const handleDelete = async () => {
    setStage("deleting");
    setError(null);
    try {
      const res = await fetch(`/api/draft/${draftId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `삭제 실패 (${res.status})`);
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
      setStage("error");
    }
  };

  return (
    <section
      className={cn(
        "rounded-xl border p-5",
        stage === "confirm"
          ? "border-danger/40 bg-danger/5"
          : "border-border bg-surface",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">위험 영역</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            글과 사진을 영구 삭제합니다. 되돌릴 수 없어요.
          </div>
        </div>

        {stage === "idle" && (
          <button
            type="button"
            onClick={() => setStage("confirm")}
            className="shrink-0 rounded-md border border-danger/40 bg-surface px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5"
          >
            글 삭제하기
          </button>
        )}

        {stage === "confirm" && (
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStage("idle")}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              정말 삭제
            </button>
          </div>
        )}

        {stage === "deleting" && (
          <span className="shrink-0 text-xs text-muted-foreground">삭제 중…</span>
        )}

        {stage === "error" && (
          <button
            type="button"
            onClick={() => {
              setStage("idle");
              setError(null);
            }}
            className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs"
          >
            닫기
          </button>
        )}
      </div>

      {stage === "confirm" && (
        <p className="mt-3 text-xs text-danger">
          <strong>{displayName}</strong> 을(를) 삭제하면 본문·사진·태그·발행 기록까지 모두 사라집니다. 한 번 더 확인해주세요.
        </p>
      )}

      {stage === "error" && error && (
        <p className="mt-3 text-xs text-danger">{error}</p>
      )}
    </section>
  );
}
