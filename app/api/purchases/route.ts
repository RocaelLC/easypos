import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import type { IngredientDoc, PurchaseDoc } from "@/lib/dbTypes";

export async function POST(req: Request) {
  const body = await req.json();
  const items = body?.items as Array<{ ingredientId: string; qty: number; unitCost: number }>;
  if (!items?.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  const db = await getDB();
  const ingredients = db.collection<IngredientDoc>("ingredients");
  const purchases = db.collection<PurchaseDoc>("purchases");

  const enriched = items.map((it) => ({
    ingredientId: String(it.ingredientId),
    qty: Number(it.qty),
    unitCost: Number(it.unitCost),
    lineTotal: Number(it.qty) * Number(it.unitCost),
  }));

  const total = enriched.reduce((s, x) => s + x.lineTotal, 0);

  for (const it of enriched) {
    const ing = await ingredients.findOne({ _id: it.ingredientId }); // ✅ ya no marca error
    if (!ing) return NextResponse.json({ error: `ingredient not found: ${it.ingredientId}` }, { status: 404 });

    const oldStock = ing.stock ?? 0;
    const oldAvg = ing.avgCost ?? 0;

    const newStock = oldStock + it.qty;
    const newAvg = newStock === 0 ? it.unitCost : (oldStock * oldAvg + it.qty * it.unitCost) / newStock;

    await ingredients.updateOne(
      { _id: it.ingredientId },
      { $set: { stock: newStock, avgCost: newAvg } }
    );
  }

  await purchases.insertOne({ createdAt: new Date(), items: enriched, total });
  return NextResponse.json({ ok: true, total });
}
