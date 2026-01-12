import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

type Method = "cash" | "transfer" | "card";
type State = "available" | "pending";
type Dir = "in" | "out";

type MovementDoc = {
  method: Method;
  state: State;
  direction: Dir;
  amount: number;
  createdAt: Date;
};

export async function GET() {
  const db = await getDB();
  const col = db.collection<MovementDoc>("wallet_movements");

  const agg = await col
    .aggregate([
      {
        $group: {
          _id: { method: "$method", state: "$state", direction: "$direction" },
          sum: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const base = {
    cash: { available: 0, pending: 0 },
    transfer: { available: 0, pending: 0 },
    card: { available: 0, pending: 0 },
  } as Record<Method, Record<State, number>>;

  for (const row of agg) {
    const method = row?._id?.method as Method;
    const state = row?._id?.state as State;
    const dir = row?._id?.direction as Dir;
    const sum = Number(row?.sum ?? 0);

    if (!method || !state || !dir) continue;
    if (!base[method] || base[method][state] === undefined) continue;

    // in suma, out resta
    base[method][state] += dir === "in" ? sum : -sum;
  }

  const availableTotal =
    base.cash.available + base.transfer.available + base.card.available;

  const pendingTotal = base.cash.pending + base.transfer.pending + base.card.pending;

  const bankSubtotal = {
    available: base.transfer.available + base.card.available,
    pending: base.transfer.pending + base.card.pending,
    total:
      base.transfer.available +
      base.card.available +
      base.transfer.pending +
      base.card.pending,
  };

  return NextResponse.json({
    byMethod: base,
    availableTotal,
    pendingTotal,
    bankSubtotal,
  });
}
