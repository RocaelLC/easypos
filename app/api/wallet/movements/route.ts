import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { ObjectId } from "mongodb";

type Method = "cash" | "transfer" | "card";
type State = "available" | "pending";
type Dir = "in" | "out";

type MovementDoc = {
  _id: ObjectId;
  amount: number;
  direction: Dir;
  method: Method;
  state: State;
  kind: string; // "sale" | "expense" | "manual" | "cash_count" | ...
  category?: string;
  supplier?: string;
  note?: string;
  origin?: { type: string; refId?: string; clientSaleId?: string };
  createdAt: Date;
  createdByEmail?: string;
  createdByUid?: string;
};

function parseCursor(cursor: string) {
  // formato: "<ISO>|<ObjectId>"
  const [iso, oid] = cursor.split("|");
  const date = iso ? new Date(iso) : null;
  const id = oid && ObjectId.isValid(oid) ? new ObjectId(oid) : null;
  if (!date || isNaN(date.getTime()) || !id) return null;
  return { date, id };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const cursor = url.searchParams.get("cursor");

  const db = await getDB();
  const col = db.collection<MovementDoc>("wallet_movements");

  const query: any = {};
  if (cursor) {
    const parsed = parseCursor(cursor);
    if (parsed) {
      // orden DESC por createdAt, _id
      query.$or = [
        { createdAt: { $lt: parsed.date } },
        { createdAt: parsed.date, _id: { $lt: parsed.id } },
      ];
    }
  }

  const items = await col
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  const nextCursor = hasMore
    ? `${page[page.length - 1].createdAt.toISOString()}|${page[page.length - 1]._id.toString()}`
    : null;

  return NextResponse.json({
    items: page.map((m) => ({
      ...m,
      _id: m._id.toString(),
      createdAt: m.createdAt.toISOString(),
    })),
    nextCursor,
  });
}
