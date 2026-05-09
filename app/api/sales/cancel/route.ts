import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getUserFromRequest, authErrorResponse } from "@/lib/serverAuth";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const saleId = body?.saleId;
    if (!saleId) {
      return NextResponse.json({ error: "saleId required" }, { status: 400 });
    }

    const db = await getDB();
    const sales = db.collection("sales");
    const ingredients = db.collection("ingredients");
    const movements = db.collection("wallet_movements");

    // 1) Obtener la venta
    let saleDoc: any = null;
    try {
      saleDoc = await sales.findOne({
        _id: new ObjectId(saleId),
        createdByUid: user.uid,
      });
    } catch {
      // Si no es ObjectId válido, intenta búsqueda directa
      saleDoc = await sales.findOne({
        _id: saleId,
        createdByUid: user.uid,
      });
    }

    if (!saleDoc) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    if (saleDoc.cancelled) {
      return NextResponse.json(
        { error: "Esta venta ya fue cancelada" },
        { status: 400 }
      );
    }

    // 2) Marcar venta como cancelada
    await sales.updateOne(
      { _id: saleDoc._id },
      {
        $set: {
          cancelled: true,
          cancelledAt: new Date(),
          cancelledByUid: user.uid,
        },
      }
    );

    // 3) Revertir inventario (sumar ingredientes de vuelta)
    try {
      const items: any[] = Array.isArray(saleDoc?.items) ? saleDoc.items : [];
      const productsCol = db.collection("products");

      for (const sold of items) {
        if (!sold.productId) continue;

        const qtySold = Number(sold.qty ?? 1);
        if (!Number.isFinite(qtySold) || qtySold <= 0) continue;

        const prod = await productsCol.findOne({
          ownerUid: user.uid,
          productId: sold.productId,
        });
        const recipe = prod?.recipe;

        if (!Array.isArray(recipe) || recipe.length === 0) continue;

        for (const r of recipe) {
          const ingId = r.ingredientId;
          const perUnit = Number(r.qty);

          if (!ingId || !Number.isFinite(perUnit)) continue;

          const need = perUnit * qtySold;

          // Sumar de vuelta (antes restamos, ahora sumamos)
          await ingredients.updateOne(
            { _id: String(ingId) } as any,
            { $inc: { stock: need } }
          );
        }
      }
    } catch {
      // No rompemos la cancelación si inventario falla
    }

    // 4) Revertir movimiento de cartera
    try {
      const clientSaleId = saleDoc.clientSaleId;
      if (clientSaleId) {
        await movements.deleteOne({
          kind: "sale",
          "origin.clientSaleId": String(clientSaleId),
          createdByUid: user.uid,
        });
      }
    } catch {
      // No rompemos si cartera falla
    }

    return NextResponse.json({ ok: true, cancelled: true });
  } catch (error) {
    console.error("POST /api/sales/cancel error:", error);
    if ((error as Error)?.message === "missing_auth_token")
      return authErrorResponse();
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo cancelar la venta",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
