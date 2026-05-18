import { cn } from "@/lib/utils";

type Props = {
  // 키 = "YYYY-MM-DD" (로컬), 값 = 그 날 작성한 편수
  dailyCounts: Record<string, number>;
};

const WEEKS_BACK = 12;

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function intensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/30";
  if (count === 2) return "bg-primary/60";
  return "bg-primary";
}

function computeStreaks(dailyCounts: Record<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  // 오늘부터 거꾸로 가면서 연속 작성한 일수
  // 단, 오늘 0편이면 어제부터 카운트 (오늘은 아직 안 끝났다는 가정)
  let pointer = new Date(today);
  if ((dailyCounts[dateKey(pointer)] ?? 0) === 0) {
    pointer = addDays(pointer, -1);
  }
  while ((dailyCounts[dateKey(pointer)] ?? 0) > 0) {
    current++;
    pointer = addDays(pointer, -1);
  }

  // 전체 기록 중 최장 연속
  const keys = Object.keys(dailyCounts).sort();
  let longest = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const k of keys) {
    if (!dailyCounts[k]) continue;
    if (prevKey) {
      const prev = new Date(prevKey);
      const next = addDays(prev, 1);
      if (dateKey(next) === k) run++;
      else run = 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevKey = k;
  }

  const todayCount = dailyCounts[dateKey(today)] ?? 0;
  return { current, longest, todayCount };
}

export function HabitTracking({ dailyCounts }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 포함, 마지막 N주 (Sun~Sat 단위)
  // 가장 최근 토요일(혹은 오늘)을 끝점으로 잡고 12주 × 7일 = 84칸
  const dayOfWeek = today.getDay(); // 0=일
  // 그리드 끝: 이번 주 토요일
  const gridEnd = addDays(today, 6 - dayOfWeek);
  const gridStart = addDays(gridEnd, -(WEEKS_BACK * 7 - 1));

  const days: Array<{ date: Date; key: string; count: number; isFuture: boolean }> = [];
  for (let i = 0; i < WEEKS_BACK * 7; i++) {
    const d = addDays(gridStart, i);
    const k = dateKey(d);
    days.push({
      date: d,
      key: k,
      count: dailyCounts[k] ?? 0,
      isFuture: d.getTime() > today.getTime(),
    });
  }

  const { current, longest, todayCount } = computeStreaks(dailyCounts);

  // 7행 × WEEKS_BACK열 — 행은 요일(일~토)
  const rows: typeof days[] = Array.from({ length: 7 }, () => []);
  for (const d of days) {
    rows[d.date.getDay()].push(d);
  }

  const KOR_DAY = ["일", "월", "화", "수", "목", "금", "토"];

  // 월 라벨 (각 주의 첫 일요일 위에 표시)
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS_BACK; w++) {
    const sunday = days[w * 7];
    if (sunday.date.getMonth() !== lastMonth) {
      monthLabels.push({ col: w, label: `${sunday.date.getMonth() + 1}월` });
      lastMonth = sunday.date.getMonth();
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {current}
            </span>
            <span className="text-sm text-muted-foreground">
              {current > 0 ? "일 연속 작성 중" : "오늘부터 시작해보세요"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {todayCount > 0
              ? `오늘 ${todayCount}편 작성 완료 — 좋은 흐름이에요`
              : "오늘은 아직 비어 있어요. 한 끼 기록해보세요"}
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-[10px] text-muted-foreground">오늘</div>
            <div className="text-lg font-semibold tabular-nums">{todayCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">최장 연속</div>
            <div className="text-lg font-semibold tabular-nums">{longest}일</div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end gap-1 pl-7 text-[10px] text-muted-foreground">
          {Array.from({ length: WEEKS_BACK }, (_, w) => {
            const label = monthLabels.find((m) => m.col === w);
            return (
              <span
                key={w}
                className="inline-block text-center"
                style={{ width: 14 }}
              >
                {label?.label ?? ""}
              </span>
            );
          })}
        </div>

        <div className="flex gap-1">
          <div className="flex flex-col justify-around pr-1 text-[9px] text-muted-foreground">
            {KOR_DAY.map((d, i) => (
              <span key={i} className="h-[14px] leading-[14px]">
                {i % 2 === 1 ? d : ""}
              </span>
            ))}
          </div>

          <div className="grid grid-flow-col auto-cols-[14px] grid-rows-7 gap-1">
            {Array.from({ length: WEEKS_BACK * 7 }, (_, i) => {
              const week = Math.floor(i / 7);
              const dow = i % 7;
              const cell = rows[dow][week];
              if (!cell || cell.isFuture) {
                return <span key={i} className="h-[12px] w-[12px]" />;
              }
              return (
                <span
                  key={i}
                  title={`${cell.key} · ${cell.count}편`}
                  className={cn(
                    "h-[12px] w-[12px] rounded-sm",
                    intensityClass(cell.count),
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>적게</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span>많이</span>
        </div>
      </div>
    </section>
  );
}
