import { prisma } from "@/lib/db";
import { DraftsBrowser } from "@/components/drafts/DraftsBrowser";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const drafts = await prisma.draft.findMany({
    orderBy: { updatedAt: "desc" },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });

  const items = drafts.map((d) => ({
    id: d.id,
    title: d.title,
    placeName: d.placeName,
    seoCategory: d.seoCategory,
    status: d.status,
    updatedAt: d.updatedAt,
    coverUrl: d.photos[0]?.publicUrl ?? undefined,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">보관함</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          지금까지 작성한 모든 리뷰를 카테고리별로 정리해서 봅니다.
        </p>
      </header>

      <DraftsBrowser drafts={items} />
    </main>
  );
}
