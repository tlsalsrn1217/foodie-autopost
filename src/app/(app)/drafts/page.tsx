import { prisma } from "@/lib/db";
import { KanbanBoard } from "@/components/drafts/KanbanBoard";
import { extractRegion } from "@/lib/region";

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
    region: extractRegion(d.placeAddr),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <header className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">보관함</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          상태별 칸반 보드. 드래그로 단계를 이동시키면 자동 저장됩니다.
        </p>
      </header>

      <KanbanBoard drafts={items} />
    </main>
  );
}
