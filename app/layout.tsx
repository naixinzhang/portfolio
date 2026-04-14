import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Naixin Zhang",
  description: "Work, gardening, Japanese porcelain, trading notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
