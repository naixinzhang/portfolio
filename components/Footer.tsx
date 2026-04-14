export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)]/70">
      <div className="max-w-3xl mx-auto px-6 py-6 text-center">
        <p className="font-serif text-[12px] italic text-[var(--muted)] tracking-wide">
          © {new Date().getFullYear()} Naixin Zhang. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
