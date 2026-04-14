import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const h = new Headers(req.headers);
  const country = h.get("x-vercel-ip-country") ?? "unknown";
  const city = h.get("x-vercel-ip-city") ?? "unknown";
  const lat = h.get("x-vercel-ip-latitude");
  const lng = h.get("x-vercel-ip-longitude");
  console.log("visit", { country, city, lat, lng });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ visits: [] });
}
