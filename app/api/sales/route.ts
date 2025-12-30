import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  const clientSaleId = body?.clientSaleId;
  if (!clientSaleId) {
    return NextResponse.json({ error: "clientSaleId required" }, { status: 400 });
  }

  const db = await getDB();
  const sales = db.collection("sales");

  // Idempotencia: si ya se guardó, no duplicar
  const exists = await sales.findOne({ clientSaleId });
  if (exists) {
    return NextResponse.json({ ok: true, duplicated: true });
  }

  await sales.insertOne({
    ...body,
    createdAt: new Date(body.createdAt ?? Date.now()),
  });

  return NextResponse.json({ ok: true });
}
