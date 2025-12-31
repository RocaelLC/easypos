import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import type { Document } from "mongodb";

type ModifierGroupDoc = {
  _id: string;
  name: string;
  min: number;
  max: number;
  required: boolean;
  options: any[];
};

export async function GET() {
  const db = await getDB();
  const items = await db
    .collection<Document>("modifier_groups")
    .find({})
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, min = 0, max = 0, required = false, options = [] } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const safeId = String(id).trim();

    const safeOptions = Array.isArray(options)
      ? options
          .map((o: any) => ({
            id: String(o.id ?? "").trim(),
            name: String(o.name ?? "").trim(),
            price: Number(o.price ?? 0),
            imageUrl: o.imageUrl ? String(o.imageUrl).trim() : undefined, // ✅ NUEVO
            ingredientId: o.ingredientId ? String(o.ingredientId).trim() : undefined,
            qty: o.ingredientId ? Number(o.qty ?? 0) : undefined,
          }))
          .filter((o: any) => o.id && o.name)
      : [];

    const db = await getDB();

    await db.collection<ModifierGroupDoc>("modifier_groups").updateOne(
      { _id: safeId },
      {
        $set: {
          _id: safeId,
          name: String(name).trim(),
          min: Number(min),
          max: Number(max),
          required: Boolean(required),
          options: safeOptions,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[modifier-groups] POST error:", err);
    return NextResponse.json({ error: err?.message ?? "internal_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await getDB();
  await db.collection<ModifierGroupDoc>("modifier_groups").deleteOne({ _id: String(id).trim() });

  return NextResponse.json({ ok: true });
}
