import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-32 text-center">
      <h1 className="text-5xl font-serif mb-6">404</h1>
      <p className="text-[var(--muted)] mb-8">This page doesn't exist.</p>
      <Link href="/" className="underline underline-offset-4">Back home</Link>
    </div>
  );
}
