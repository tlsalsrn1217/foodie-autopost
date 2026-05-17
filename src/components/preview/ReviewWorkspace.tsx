"use client";

import { useCallback, useState } from "react";
import { ReviewSection } from "./ReviewSection";
import { TitleEditor } from "./TitleEditor";

type PhotoRef = {
  order: number;
  publicUrl: string;
};

type Meta = {
  summary: string | null;
  category: string | null;
  tags: string[];
};

type LiveMeta = Meta & { title: string | null };

type Props = {
  draftId: string;
  initialTitle: string | null;
  initialMarkdown: string | null;
  initialStatus: string;
  initialMeta: Meta;
  photos: PhotoRef[];
};

export function ReviewWorkspace({
  draftId,
  initialTitle,
  initialMarkdown,
  initialStatus,
  initialMeta,
  photos,
}: Props) {
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [liveTitle, setLiveTitle] = useState<string | null>(initialTitle);
  const [currentTitle, setCurrentTitle] = useState<string | null>(initialTitle);

  const handleMetaChange = useCallback((next: LiveMeta) => {
    setMeta((prev) =>
      next.summary === null && next.category === null && next.tags.length === 0
        ? prev
        : { summary: next.summary, category: next.category, tags: next.tags },
    );
    if (next.title) setLiveTitle(next.title);
  }, []);

  const tagsAsCsv = meta.tags.join(", ");
  const tagsAsHashtag = meta.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");

  return (
    <div className="space-y-6">
      <TitleEditor
        draftId={draftId}
        initialTitle={initialTitle}
        liveTitle={liveTitle}
        onTitleChange={setCurrentTitle}
      />

      {(meta.summary || meta.category || meta.tags.length > 0) && (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">검색 노출용 메타</h2>
            <span className="text-[10px] text-muted-foreground">
              네이버 블로그 발행 시 사용
            </span>
          </div>

          {meta.summary && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                요약 (썸네일 아래 노출)
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {meta.summary}
              </p>
            </div>
          )}

          {meta.category && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                추천 카테고리
              </div>
              <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                {meta.category}
              </span>
            </div>
          )}

          {meta.tags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  태그 ({meta.tags.length}개)
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(tagsAsCsv)}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] hover:bg-muted"
                    title="쉼표로 구분된 형태로 복사"
                  >
                    , 복사
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(tagsAsHashtag)}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] hover:bg-muted"
                    title="해시태그 형태로 복사"
                  >
                    # 복사
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {meta.tags.map((t, i) => (
                  <span
                    key={`${i}-${t}`}
                    className="rounded-full bg-surface border border-accent/30 px-2.5 py-0.5 text-xs text-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ReviewSection
        draftId={draftId}
        initialMarkdown={initialMarkdown}
        initialStatus={initialStatus}
        photos={photos}
        currentTitle={currentTitle}
        onMetaChange={handleMetaChange}
      />
    </div>
  );
}
