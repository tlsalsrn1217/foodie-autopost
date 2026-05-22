"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
};

const HomeIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12 12 4l9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
);

const ComposeIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ArchiveIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </svg>
);

const SendIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7z" />
  </svg>
);

const EyeIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SettingsIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const MAIN: Item[] = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/compose", label: "새 리뷰", icon: ComposeIcon },
  { href: "/drafts", label: "보관함", icon: ArchiveIcon },
  { href: "/mockup", label: "디자인 미리보기", icon: EyeIcon },
  { href: "/published", label: "발행 기록", icon: SendIcon, soon: true },
];

const FOOTER: Item[] = [
  { href: "/settings", label: "설정", icon: SettingsIcon, soon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItem = (item: Item) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.soon ? "#" : item.href}
        aria-disabled={item.soon}
        onClick={(e) => item.soon && e.preventDefault()}
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          item.soon && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground",
        )}
      >
        <span className={cn("shrink-0", active && "text-primary")}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.soon && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
            준비 중
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-border/60">
        <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent" />
        <div>
          <div className="text-sm font-bold tracking-tight">푸디</div>
          <div className="text-[10px] text-muted-foreground -mt-0.5">개인 음식 일지</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {MAIN.map(renderItem)}
      </nav>

      <div className="border-t border-border/60 px-3 py-3 space-y-1">
        {FOOTER.map(renderItem)}
      </div>
    </aside>
  );
}
