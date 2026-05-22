import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ReviewWorkspace } from "@/components/preview/ReviewWorkspace";
import { PublishActions } from "@/components/preview/PublishActions";
import { DeleteDraftButton } from "@/components/preview/DeleteDraftButton";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!draft) notFound();

  const photoRefs = draft.photos
    .filter((p) => !!p.publicUrl)
    .map((p) => ({
      order: p.order,
      publicUrl: p.publicUrl as string,
      mimeType: p.mimeType,
    }));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 대시보드로
        </Link>
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {draft.status}
        </span>
      </div>

      {draft.placeName && (
        <div className="mb-6 rounded-md border border-border bg-surface/60 px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground mb-0.5">방문 장소</div>
          <div className="text-sm font-medium">{draft.placeName}</div>
          {draft.placeAddr && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {draft.placeAddr}
            </div>
          )}
        </div>
      )}

      <ReviewWorkspace
        draftId={draft.id}
        initialTitle={draft.title}
        initialMarkdown={draft.reviewMarkdown}
        initialStatus={draft.status}
        initialMeta={{
          summary: draft.seoSummary,
          category: draft.seoCategory,
          tags: draft.seoTags,
        }}
        photos={photoRefs}
      />

      {draft.reviewMarkdown && (
        <div className="mt-6">
          <PublishActions
            draftId={draft.id}
            status={draft.status}
            publishedAt={draft.publishedAt}
            title={draft.title}
            photos={photoRefs}
          />
        </div>
      )}

      <details className="mt-8 rounded-md border border-border bg-surface/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground select-none">
          입력 정보 보기 ({draft.photos.length}장 · 키워드 {draft.keywords.length}개)
        </summary>
        <div className="mt-4 space-y-4">
          {draft.mood && (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">한 줄 감상</h3>
              <p className="whitespace-pre-wrap text-foreground">{draft.mood}</p>
            </div>
          )}
          {draft.keywords.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">키워드</h3>
              <div className="flex flex-wrap gap-1.5">
                {draft.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-muted-foreground">원본 사진</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {draft.photos.map((p) => (
                <div
                  key={p.id}
                  className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
                >
                  {p.publicUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.publicUrl}
                      alt={p.storageKey}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <div className="mt-10">
        <DeleteDraftButton
          draftId={draft.id}
          title={draft.title}
          placeName={draft.placeName}
        />
      </div>
    </main>
  );
}
