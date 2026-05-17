import Link from "next/link";
import { prisma } from "@/lib/db";

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

function formatRelative(d: Date) {
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  DRAFTING: "초안",
  GENERATING: "생성 중",
  READY: "완성",
  PUBLISHED: "발행됨",
  FAILED: "실패",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFTING: "bg-muted text-muted-foreground",
  GENERATING: "bg-accent/15 text-accent",
  READY: "bg-primary/10 text-primary",
  PUBLISHED: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
};

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

export default async function DashboardHome() {
  const greeting = getGreeting();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [recentDrafts, totalCount, weekCount, monthCount] = await Promise.all([
    prisma.draft.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        photos: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    }),
    prisma.draft.count(),
    prisma.draft.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.draft.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

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
              <div className="font-semibold text-foreground">새 리뷰 만들기</div>
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
          <h2 className="text-sm font-semibold text-foreground">
            최근 작성한 리뷰
          </h2>
          <span className="text-xs text-muted-foreground">
            {recentDrafts.length}편 표시 / 전체 {totalCount}편
          </span>
        </div>

        {recentDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted-foreground shadow-soft">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                <path d="M16 4v4h4" />
                <path d="M8 13h8M8 17h5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              아직 작성한 리뷰가 없어요
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              첫 한 끼부터 기록해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentDrafts.map((d) => {
              const cover = d.photos[0]?.publicUrl;
              const displayTitle =
                d.title ?? d.placeName ?? "제목 없는 초안";
              return (
                <Link
                  key={d.id}
                  href={`/preview/${d.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        사진 없음
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[d.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="font-semibold text-sm text-foreground line-clamp-2">
                      {displayTitle}
                    </div>
                    {d.placeName && d.title && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        {d.placeName}
                      </div>
                    )}
                    <div className="mt-auto pt-3 text-[11px] text-muted-foreground">
                      {formatRelative(d.updatedAt)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
