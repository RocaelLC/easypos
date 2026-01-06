import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  const db = await getDB();

  // Agrupa por method + state y aplica signo por direction
  const rows = await db.collection("wallet_movements").aggregate([
    {
      $project: {
        method: 1,
        state: 1,
        signed: {
          $cond: [
            { $eq: ["$direction", "in"] },
            "$amount",
            { $multiply: ["$amount", -1] },
          ],
        },
      },
    },
    {
      $group: {
        _id: { method: "$method", state: "$state" },
        total: { $sum: "$signed" },
      },
    },
  ]).toArray();

  const base = {
    cash: { available: 0, pending: 0 },
    transfer: { available: 0, pending: 0 },
    card: { available: 0, pending: 0 },
  };

  for (const r of rows) {
    const method = r?._id?.method;
    const state = r?._id?.state;
    if (!base[method as keyof typeof base]) continue;
    if (state !== "available" && state !== "pending") continue;
    base[method as keyof typeof base][state as keyof typeof base[keyof typeof base]] = Number(r.total || 0);
  }

  const availableTotal =
    base.cash.available + base.transfer.available + base.card.available;

  const pendingTotal =
    base.cash.pending + base.transfer.pending + base.card.pending;

  const bankSubtotal = {
    available: base.transfer.available + base.card.available,
    pending: base.transfer.pending + base.card.pending,
  };

  return NextResponse.json({
    byMethod: base,
    availableTotal,
    pendingTotal,
    bankSubtotal: {
      ...bankSubtotal,
      total: bankSubtotal.available + bankSubtotal.pending,
    },
  });
}
