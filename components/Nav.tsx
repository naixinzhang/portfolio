import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full border-b border-[var(--border)]">
      <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Naixin Zhang
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:opacity-70">About</Link>
          <Link href="/build" className="hover:opacity-70">Build</Link>
          <Link href="/outside" className="hover:opacity-70">Outside</Link>
        </div>
      </div>
    </nav>
  );
}
