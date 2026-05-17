import Link from "next/link";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-surface/70 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent" />
          <span className="text-sm font-bold">푸디</span>
        </Link>
      </div>
      {title && (
        <h1 className="hidden lg:block text-sm font-semibold text-foreground">
          {title}
        </h1>
      )}
      <div />
    </header>
  );
}
