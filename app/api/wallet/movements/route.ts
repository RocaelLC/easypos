import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDB } from "@/lib/db";

type Method = "cash" | "transfer" | "card";
type State = "available" | "pending";
type Dir = "in" | "out";

type MovementDoc = {
  _id: ObjectId;
  amount: number;
  direction: Dir;
  method: Method;
  state: State;
  kind: string;
  category?: string;
  supplier?: string;
  note?: string;
  origin?: { type: string; refId?: string; clientSaleId?: string };
  createdAt: Date;
  createdByEmail?: string;
  createdByUid?: string;
};

function parseCursor(cursor: string) {
  const [iso, oid] = cursor.split("|");
  const date = iso ? new Date(iso) : null;
  const id = oid && ObjectId.isValid(oid) ? new ObjectId(oid) : null;
  if (!date || Number.isNaN(date.getTime()) || !id) return null;
  return { date, id };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const cursor = url.searchParams.get("cursor");

    const db = await getDB();
    const collection = db.collection<MovementDoc>("wallet_movements");

    const query: Record<string, unknown> = {};
    if (cursor) {
      const parsed = parseCursor(cursor);
      if (parsed) {
        query.$or = [
          { createdAt: { $lt: parsed.date } },
          { createdAt: parsed.date, _id: { $lt: parsed.id } },
        ];
      }
    }

    const items = await collection
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
      ok: true,
      items: page.map((item) => ({
        ...item,
        _id: item._id.toString(),
        createdAt: item.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("GET /api/wallet/movements error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar los movimientos de cartera",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
