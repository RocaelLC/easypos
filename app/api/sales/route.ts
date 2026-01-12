import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { ObjectId } from "mongodb";

type SaleItem = {
    productId?: string; // requerido para inventario por receta
    qty?: number;       // requerido para inventario por receta
    name?: string;
    price?: number;
};

export async function POST(req: Request) {
    const body = await req.json();

    const clientSaleId = body?.clientSaleId;
    if (!clientSaleId) {
        return NextResponse.json({ error: "clientSaleId required" }, { status: 400 });
    }

    const db = await getDB();
    const sales = db.collection("sales");

    // 1) Idempotencia
    const exists = await sales.findOne({ clientSaleId });
    if (exists) {
        return NextResponse.json({ ok: true, duplicated: true });
    }

    // 2) Guardar venta
    const saleDoc = {
        ...body,
        createdAt: new Date(body.createdAt ?? Date.now()),
    };

    await sales.insertOne(saleDoc);
  // ✅ 2.1) Movimiento de cartera por venta (idempotente por clientSaleId)
try {
  const paymentMethod = String(body?.paymentMethod ?? "cash") as "cash" | "transfer" | "card";
  const total = Number(body?.total ?? 0);

  // regla inicial: tarjeta queda pendiente
  const state = paymentMethod === "card" ? "pending" : "available";

  await db.collection("wallet_movements").updateOne(
    { kind: "sale", "origin.clientSaleId": String(clientSaleId) },
    {
      $setOnInsert: {
        kind: "sale",
        direction: "in",
        method: paymentMethod,
        state,
        amount: total,
        origin: { type: "sale", clientSaleId: String(clientSaleId) },
        createdAt: new Date(body.createdAt ?? Date.now()),
      },
    },
    { upsert: true }
  );
} catch {
  // no rompemos la venta si cartera falla
}


    // 3) Inventario (opcional): descuenta insumos según receta
    // Solo funciona si items trae productId y qty y existe colección products con recipe[]
    try {
        const items: SaleItem[] = Array.isArray(body?.items) ? body.items : [];
        const productsCol = db.collection("products");
        const ingredientsCol = db.collection("ingredients");

        for (const sold of items) {
            if (!sold.productId) continue;

            const qtySold = Number(sold.qty ?? 1);
            if (!Number.isFinite(qtySold) || qtySold <= 0) continue;

            const prod = await productsCol.findOne({ _id: new ObjectId(sold.productId) });
            const recipe = prod?.recipe;

            if (!Array.isArray(recipe) || recipe.length === 0) continue;

            for (const r of recipe) {
                const ingId = r.ingredientId;
                const perUnit = Number(r.qty);

                if (!ingId || !Number.isFinite(perUnit)) continue;

                const need = perUnit * qtySold;

                await ingredientsCol.updateOne(
                    { _id: String(r.ingredientId) } as any,
                    { $inc: { stock: -need } }
                );

            }
        }
    } catch {
        // No rompemos la venta si inventario aún no está listo
    }

    return NextResponse.json({ ok: true });
}
