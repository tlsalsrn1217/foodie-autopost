import Link from "next/link";

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

function formatRelative(d: Date) {
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export type DraftCardData = {
  id: string;
  title: string | null;
  placeName: string | null;
  seoCategory: string | null;
  status: string;
  updatedAt: Date;
  coverUrl: string | undefined;
};

export function DraftCard({ draft }: { draft: DraftCardData }) {
  const displayTitle = draft.title ?? draft.placeName ?? "제목 없는 초안";
  return (
    <Link
      href={`/preview/${draft.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {draft.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            사진 없음
          </div>
        )}
        <span
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[draft.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {STATUS_LABEL[draft.status] ?? draft.status}
        </span>
        {draft.seoCategory && (
          <span className="absolute top-2 right-2 rounded-full bg-foreground/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            {draft.seoCategory}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="font-semibold text-sm text-foreground line-clamp-2">
          {displayTitle}
        </div>
        {draft.placeName && draft.title && (
          <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
            {draft.placeName}
          </div>
        )}
        <div className="mt-auto pt-3 text-[11px] text-muted-foreground">
          {formatRelative(draft.updatedAt)}
        </div>
      </div>
    </Link>
  );
}
