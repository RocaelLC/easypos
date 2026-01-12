import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import type { IngredientDoc, PurchaseDoc } from "@/lib/dbTypes";

export async function POST(req: Request) {
  const body = await req.json();

  const items = body?.items as Array<{ ingredientId: string; qty: number; unitCost: number }>;
  if (!items?.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  const method = String(body?.method ?? "cash") as "cash" | "transfer" | "card";
  const category = String(body?.category ?? "Insumos");
  const supplier = body?.supplier ? String(body.supplier) : undefined;

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
 const purchaseDoc: any = {
    createdAt: new Date(),
    items: enriched,
    total,
    method,
    category,
    supplier,
  };

  const ins = await purchases.insertOne(purchaseDoc);
    
  


  // ✅ Movimiento de cartera por compra/gasto
  try {
    await db.collection("wallet_movements").insertOne({
      kind: "expense",
      direction: "out",
      method,
      state: "available", // gastos siempre salen de disponible
      amount: total,
      category,
      supplier,
      origin: { type: "purchase", refId: ins.insertedId.toString() },
      createdAt: purchaseDoc.createdAt,
    });
  } catch {
    // no rompemos compra si cartera falla
  }

  return NextResponse.json({ ok: true, total });

  return NextResponse.json({ ok: true, total });
}
