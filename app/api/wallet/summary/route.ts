import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDB();

    const rows = await db
      .collection("wallet_movements")
      .aggregate([
        {
          $project: {
            method: 1,
            state: 1,
            signed: {
              $cond: [{ $eq: ["$direction", "in"] }, "$amount", { $multiply: ["$amount", -1] }],
            },
          },
        },
        {
          $group: {
            _id: { method: "$method", state: "$state" },
            total: { $sum: "$signed" },
          },
        },
      ])
      .toArray();

    const base = {
      cash: { available: 0, pending: 0 },
      transfer: { available: 0, pending: 0 },
      card: { available: 0, pending: 0 },
    };

    for (const row of rows) {
      const method = row?._id?.method;
      const state = row?._id?.state;
      if (!base[method as keyof typeof base]) continue;
      if (state !== "available" && state !== "pending") continue;
      base[method as keyof typeof base][state as keyof typeof base[keyof typeof base]] = Number(row.total || 0);
    }

    const availableTotal = base.cash.available + base.transfer.available + base.card.available;
    const pendingTotal = base.cash.pending + base.transfer.pending + base.card.pending;
    const bankSubtotal = {
      available: base.transfer.available + base.card.available,
      pending: base.transfer.pending + base.card.pending,
    };

    return NextResponse.json({
      ok: true,
      byMethod: base,
      availableTotal,
      pendingTotal,
      bankSubtotal: {
        ...bankSubtotal,
        total: bankSubtotal.available + bankSubtotal.pending,
      },
    });
  } catch (error) {
    console.error("GET /api/wallet/summary error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo cargar el resumen de cartera",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
