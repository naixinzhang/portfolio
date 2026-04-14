import { NextResponse } from "next/server";
import { redis, VIEWS_KEY } from "../../../lib/redis";

export const runtime = "edge";

export async function POST() {
  const count = await redis.incr(VIEWS_KEY);
  return NextResponse.json({ count });
}

export async function GET() {
  const count = (await redis.get<number>(VIEWS_KEY)) ?? 0;
  return NextResponse.json({ count });
}
