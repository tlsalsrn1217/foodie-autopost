"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

type PhotoRef = {
  order: number;
  publicUrl: string;
  mimeType?: string;
};

type Props = {
  draftId: string;
  status: string;
  publishedAt: Date | null;
  title: string | null;
  photos: PhotoRef[];
};

function extFromMime(mime?: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return "jpg";
  }
}

export function PublishActions({
  draftId,
  status,
  publishedAt,
  title,
  photos,
}: Props) {
  const router = useRouter();
  const [zipState, setZipState] = useState<
    "idle" | "building" | "done" | "error"
  >("idle");
  const [publishState, setPublishState] = useState<
    "idle" | "saving" | "error"
  >("idle");

  const downloadZip = async () => {
    if (photos.length === 0) return;
    setZipState("building");
    try {
      const zip = new JSZip();
      const folderName = (title?.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "review").trim();
      const folder = zip.folder(folderName) ?? zip;

      await Promise.all(
        photos.map(async (p) => {
          const res = await fetch(p.publicUrl, { mode: "cors" });
          if (!res.ok) throw new Error(`사진 ${p.order + 1} 다운로드 실패`);
          const blob = await res.blob();
          const ext = extFromMime(p.mimeType ?? blob.type);
          const idx = String(p.order + 1).padStart(2, "0");
          folder.file(`${idx}.${ext}`, blob);
        }),
      );

      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, `${folderName}.zip`);
      setZipState("done");
    } catch {
      setZipState("error");
    }
    setTimeout(() => setZipState("idle"), 2400);
  };

  const isPublished = status === "PUBLISHED";

  const togglePublished = async () => {
    setPublishState("saving");
    try {
      const res = await fetch(`/api/draft/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isPublished ? "READY" : "PUBLISHED",
          publishedAt: isPublished ? null : new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setPublishState("idle");
      router.refresh();
    } catch {
      setPublishState("error");
      setTimeout(() => setPublishState("idle"), 2400);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold">발행 도우미</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          네이버 블로그에 옮길 때 필요한 액션들을 모았어요.
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">사진 ZIP 다운로드</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {photos.length}장을 01.jpg, 02.jpg ... 형태로 묶어 받아요. 자리표시자 순서대로 정렬.
            </div>
          </div>
          <button
            type="button"
            onClick={downloadZip}
            disabled={zipState === "building" || photos.length === 0}
            className={cn(
              "shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50",
              zipState === "done" && "border-success text-success bg-success/10",
              zipState === "error" && "border-danger text-danger",
            )}
          >
            {zipState === "building" && "묶는 중…"}
            {zipState === "done" && "✓ 받기 완료"}
            {zipState === "error" && "실패"}
            {zipState === "idle" && "ZIP 다운로드"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {isPublished ? "발행 완료 표시됨" : "네이버에 올렸나요?"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {isPublished
                ? publishedAt
                  ? `발행 표시: ${new Date(publishedAt).toLocaleString("ko-KR")}`
                  : "발행 완료로 표시됨"
                : "네이버에 글을 다 올린 뒤 눌러주세요. 대시보드에서 '발행됨'으로 표시돼요."}
            </div>
          </div>
          <button
            type="button"
            onClick={togglePublished}
            disabled={publishState === "saving"}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium shadow-soft",
              isPublished
                ? "border border-border bg-surface text-foreground hover:bg-muted"
                : "bg-success text-white hover:opacity-90",
              publishState === "saving" && "opacity-50",
            )}
          >
            {publishState === "saving"
              ? "저장 중…"
              : isPublished
                ? "발행 표시 해제"
                : "발행 완료로 표시"}
          </button>
        </div>

        {publishState === "error" && (
          <p className="text-xs text-danger">발행 상태 저장에 실패했어요.</p>
        )}
      </div>
    </section>
  );
}
