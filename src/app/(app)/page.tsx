import Link from "next/link";
import { prisma } from "@/lib/db";
import { DraftCard } from "@/components/drafts/DraftCard";
import { HabitTracking } from "@/components/dashboard/HabitTracking";

export const dynamic = "force-dynamic";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "늦은 밤이네요";
  if (hour < 11) return "좋은 아침이에요";
  if (hour < 14) return "맛있는 점심 드셨나요";
  if (hour < 18) return "오후의 한 잔, 어떠셨어요";
  if (hour < 22) return "오늘 저녁은 어땠나요";
  return "오늘 하루 수고하셨어요";
}

type StatProps = { label: string; value: number | string; sub?: string };
function StatCard({ label, value, sub }: StatProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DashboardHome() {
  const greeting = getGreeting();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const heatmapStart = new Date(now);
  heatmapStart.setDate(heatmapStart.getDate() - 90);
  heatmapStart.setHours(0, 0, 0, 0);

  const [recentDrafts, totalCount, weekCount, monthCount, recent90] = await Promise.all([
    prisma.draft.findMany({
      orderBy: { updatedAt: "desc" },
      take: 9,
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.draft.count(),
    prisma.draft.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.draft.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.draft.findMany({
      where: { createdAt: { gte: heatmapStart } },
      select: { createdAt: true },
    }),
  ]);

  // 일별 작성 편수 집계
  const dailyCounts: Record<string, number> = {};
  for (const d of recent90) {
    const k = dateKey(d.createdAt);
    dailyCounts[k] = (dailyCounts[k] ?? 0) + 1;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <section>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          오늘은 어떤 한 그릇을 만나셨나요?
        </h1>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="이번 주" value={weekCount} sub="편" />
        <StatCard label="이번 달" value={monthCount} sub="편" />
        <StatCard label="전체" value={totalCount} sub="편" />
      </section>

      <HabitTracking dailyCounts={dailyCounts} />

      <section>
        <Link
          href="/compose"
          className="group block rounded-xl border border-border bg-surface p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-2xl font-light text-primary-foreground">
              +
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">새 포스트 생성</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                사진과 짧은 메모만 있으면 충분해요
              </div>
            </div>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold text-foreground">최근 작성한 리뷰</h2>
          <Link href="/drafts" className="text-xs text-primary hover:underline">
            전체 보관함 →
          </Link>
        </div>

        {recentDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">
              아직 작성한 리뷰가 없어요
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              첫 한 끼부터 기록해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentDrafts.map((d) => (
              <DraftCard
                key={d.id}
                draft={{
                  id: d.id,
                  title: d.title,
                  placeName: d.placeName,
                  seoCategory: d.seoCategory,
                  status: d.status,
                  updatedAt: d.updatedAt,
                  coverUrl: d.photos[0]?.publicUrl ?? undefined,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
