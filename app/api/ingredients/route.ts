import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import type { IngredientDoc } from "@/lib/dbTypes";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, unit, stock = 0, minStock = 0, avgCost = 0 } = body;

  if (!id || !name || !unit) return NextResponse.json({ error: "id, name, unit required" }, { status: 400 });

  const db = await getDB();
  const ingredients = db.collection<IngredientDoc>("ingredients");

  await ingredients.updateOne(
    { _id: String(id) },
    {
      $set: {
        _id: String(id),
        name: String(name),
        unit,
        stock: Number(stock),
        minStock: Number(minStock),
        avgCost: Number(avgCost),
      },
    },
    { upsert: true }
    
  );

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const db = await getDB();
  const ingredients = db.collection<IngredientDoc>("ingredients");
  const items = await ingredients.find({}).sort({ name: 1 }).toArray();
  return NextResponse.json({ items });
  
}
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await getDB();
  const ingredients = db.collection<IngredientDoc>("ingredients");

  await ingredients.deleteOne({ _id: String(id) });
  return NextResponse.json({ ok: true });
}