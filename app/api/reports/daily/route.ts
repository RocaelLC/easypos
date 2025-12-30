import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD opcional

  const start = dateStr ? new Date(dateStr + "T00:00:00.000Z") : new Date();
  if (!dateStr) start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const db = await getDB();
  const sales = db.collection("sales");

  const agg = await sales.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$total" } } },
  ]).toArray();

  const byMethod: any = {
    cash: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    card: { count: 0, total: 0 },
  };

  for (const r of agg) {
    const k = r._id ?? "cash";
    byMethod[k] = { count: r.count, total: r.total };
  }

  const grand = Object.values(byMethod).reduce(
    (acc: any, v: any) => ({ count: acc.count + (v as any).count, total: acc.total + (v as any).total }),
    { count: 0, total: 0 }
  );

  return NextResponse.json({ range: { start, end }, byMethod, grand });
}
