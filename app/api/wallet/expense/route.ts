import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { assertPositiveAmount, normalizeMethod, normalizeState } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amount = assertPositiveAmount(body.amount);
    const method = normalizeMethod(body.method);
    const state = normalizeState(body.state ?? "available"); // normalmente available
    const category = String(body.category ?? "Insumos").trim();
    const supplier = body.supplier ? String(body.supplier).trim() : undefined;
    const note = body.note ? String(body.note).trim() : "";

    // 🔐 usuario placeholder por ahora
    const createdByUid = String(body.createdByUid ?? "dev");
    const createdByEmail = body.createdByEmail ? String(body.createdByEmail) : undefined;

    const doc = {
      amount,
      direction: "out",
      method,
      state,
      kind: "expense",
      category,
      supplier,
      note,
      origin: { type: "expense", refId: body.refId ? String(body.refId) : undefined },
      createdAt: new Date(),
      createdByUid,
      createdByEmail,
    };

    const db = await getDB();
    await db.collection("wallet_movements").insertOne(doc);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[wallet/expense] error", e);
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}
