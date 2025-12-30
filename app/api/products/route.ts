import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export type ProductRecipeItemDoc = {
  ingredientId: string; // insumo base a descontar
  qty: number;
};

export type ProductDoc = {
  _id: string; // ✅ string
  name: string;
  price: number;
  category: string;
  active: boolean;
  modifierGroupIds: string[];
  recipe: ProductRecipeItemDoc[]; // para inventario (luego lo conectamos)
};

export async function GET() {
  const db = await getDB();
  const items = await db
    .collection<ProductDoc>("products")
    .find({})
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      price = 0,
      category = "general",
      active = true,
      modifierGroupIds = [],
      recipe = [],
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const safeId = String(id).trim();

    const safeGroups: string[] = Array.isArray(modifierGroupIds)
      ? modifierGroupIds.map((x: any) => String(x).trim()).filter(Boolean)
      : [];

    const safeRecipe: ProductRecipeItemDoc[] = Array.isArray(recipe)
      ? recipe
          .map((r: any) => ({
            ingredientId: String(r.ingredientId ?? "").trim(),
            qty: Number(r.qty ?? 0),
          }))
          .filter((r) => r.ingredientId && Number.isFinite(r.qty) && r.qty > 0)
      : [];

    const doc: ProductDoc = {
      _id: safeId,
      name: String(name).trim(),
      price: Number(price ?? 0),
      category: String(category ?? "general").trim() || "general",
      active: Boolean(active),
      modifierGroupIds: safeGroups,
      recipe: safeRecipe,
    };

    const db = await getDB();
    await db.collection<ProductDoc>("products").updateOne(
      { _id: safeId }, // ✅ string
      { $set: doc },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[products] POST error:", err);
    return NextResponse.json({ error: err?.message ?? "internal_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await getDB();
  await db.collection<ProductDoc>("products").deleteOne({ _id: String(id).trim() });

  return NextResponse.json({ ok: true });
}
