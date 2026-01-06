import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { assertPositiveAmount, normalizeMethod, normalizeState } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const direction = body.direction === "out" ? "out" : "in";
    const amount = assertPositiveAmount(body.amount);
    const method = normalizeMethod(body.method);
    const state = normalizeState(body.state ?? "available");
    const note = String(body.note ?? "").trim();
    const kind = (body.kind === "adjustment") ? "adjustment" : "manual";

    if (!note) {
      return NextResponse.json({ error: "note_required" }, { status: 400 });
    }

    // 🔐 Usuario: por ahora placeholder (luego lo conectamos a Firebase token)
    const createdByUid = String(body.createdByUid ?? "dev");
    const createdByEmail = body.createdByEmail ? String(body.createdByEmail) : undefined;

    const doc = {
      amount,
      direction,
      method,
      state,
      kind,
      note,
      origin: { type: "manual" },
      createdAt: new Date(),
      createdByUid,
      createdByEmail,
    };

    const db = await getDB();
    await db.collection("wallet_movements").insertOne(doc);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[wallet/manual] error", e);
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}
