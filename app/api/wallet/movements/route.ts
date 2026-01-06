import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const cursor = searchParams.get("cursor"); // createdAt ISO

  const db = await getDB();

  const q: any = {};
  if (cursor) q.createdAt = { $lt: new Date(cursor) };

  const items = await db
    .collection("wallet_movements")
    .find(q)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const nextCursor =
    items.length > 0 ? new Date(items[items.length - 1].createdAt).toISOString() : null;

  return NextResponse.json({ items, nextCursor });
}
