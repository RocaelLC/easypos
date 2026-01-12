import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

type Method = "cash" | "transfer" | "card";
type State = "available" | "pending";
type Dir = "in" | "out";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const direction = body?.direction as Dir;
  const method = body?.method as Method;
  const state = body?.state as State;
  const kind = body?.kind as string; // "manual" | "adjustment"
  const amount = Number(body?.amount ?? 0);
  const note = String(body?.note ?? "").trim();

  if (!["in", "out"].includes(direction)) {
    return NextResponse.json({ error: "direction invalid" }, { status: 400 });
  }
  if (!["cash", "transfer", "card"].includes(method)) {
    return NextResponse.json({ error: "method invalid" }, { status: 400 });
  }
  if (!["available", "pending"].includes(state)) {
    return NextResponse.json({ error: "state invalid" }, { status: 400 });
  }
  if (!kind) {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount invalid" }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }

  // regla: efectivo nunca pendiente
  const safeState: State = method === "cash" ? "available" : state;

  const db = await getDB();
  await db.collection("wallet_movements").insertOne({
    direction,
    method,
    state: safeState,
    kind,
    amount,
    note,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
