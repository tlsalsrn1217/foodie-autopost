"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const PRIMARY = "#7C6DF5";
const ACCENT = "#5BA4F5";
const MUTED = "#E5E4F4";
const STATUS_COLORS: Record<string, string> = {
  DRAFTING: "#9CA3AF",
  GENERATING: ACCENT,
  READY: PRIMARY,
  PUBLISHED: "#4ADE80",
  FAILED: "#F87171",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFTING: "초안",
  GENERATING: "생성 중",
  READY: "완성",
  PUBLISHED: "발행됨",
  FAILED: "실패",
};

const CATEGORY_PALETTE = [PRIMARY, ACCENT, "#A78BFA", "#22D3EE", "#FB7185", "#FBBF24"];

type MonthBucket = { month: string; count: number };
type StatusBucket = { status: string; count: number };
type CategoryBucket = { category: string; count: number };

export function MonthlyTrendChart({ data }: { data: MonthBucket[] }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <EmptyChart message="아직 데이터가 부족해요. 리뷰를 더 써보세요." />
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={MUTED} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#6B6C8B" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#6B6C8B" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(124, 109, 245, 0.06)" }}
          contentStyle={{
            background: "white",
            border: "1px solid #E5E4F4",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#1A1B3D", fontWeight: 600 }}
          formatter={(v) => [`${v}편`, "작성"]}
        />
        <Bar dataKey="count" fill={PRIMARY} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonutChart({ data }: { data: StatusBucket[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return <EmptyChart message="아직 리뷰가 없어요." />;
  }
  const enriched = data.map((d) => ({
    name: STATUS_LABEL[d.status] ?? d.status,
    value: d.count,
    raw: d.status,
  }));
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={enriched}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {enriched.map((entry, i) => (
              <Cell
                key={i}
                fill={STATUS_COLORS[entry.raw] ?? CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #E5E4F4",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, _n, item) => [`${v}편`, item.payload?.name ?? ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] text-muted-foreground">총</div>
        <div className="text-2xl font-bold text-foreground tabular-nums">{total}</div>
        <div className="text-[10px] text-muted-foreground">편</div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]">
        {enriched.map((e) => (
          <li key={e.raw} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: STATUS_COLORS[e.raw] }}
            />
            <span className="text-muted-foreground">{e.name}</span>
            <span className="text-foreground font-medium tabular-nums">{e.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryBarsChart({ data }: { data: CategoryBucket[] }) {
  if (data.length === 0) {
    return <EmptyChart message="아직 카테고리 데이터가 없어요." />;
  }
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 6);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 36)}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={MUTED} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#6B6C8B" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#1A1B3D" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "rgba(124, 109, 245, 0.06)" }}
          contentStyle={{
            background: "white",
            border: "1px solid #E5E4F4",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${v}편`, "작성"]}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: "#6B6C8B" }}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
      {message}
    </div>
  );
}
