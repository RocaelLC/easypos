import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

type Method = "cash" | "transfer" | "card";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}
function endOfYear(d: Date) {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function toISODate(d: Date) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeScope(v: string | null): "day" | "month" | "year" {
  if (v === "month" || v === "year") return v;
  return "day";
}

function normalizeDateParam(dateStr: string | null) {
  // date=YYYY-MM-DD opcional
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0); // midday para evitar edge tz
  if (Number.isNaN(dt.getTime())) return new Date();
  return dt;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const date = normalizeDateParam(searchParams.get("date"));

    let from: Date;
    let to: Date;

    if (scope === "day") {
      from = startOfDay(date);
      to = endOfDay(date);
    } else if (scope === "month") {
      from = startOfMonth(date);
      to = endOfMonth(date);
    } else {
      from = startOfYear(date);
      to = endOfYear(date);
    }

    const db = await getDB();
    const sales = db.collection("sales");

    const docs = await sales
      .find({ createdAt: { $gte: from, $lte: to } })
      .sort({ createdAt: -1 })
      .toArray();

    const base = {
      cash: { total: 0, count: 0 },
      transfer: { total: 0, count: 0 },
      card: { total: 0, count: 0 },
    };

    for (const s of docs as any[]) {
      const method = (s.paymentMethod ?? "cash") as Method;
      const amount = Number(s.total ?? 0);
      if (!Number.isFinite(amount)) continue;

      if (method === "cash" || method === "transfer" || method === "card") {
        base[method].total += amount;
        base[method].count += 1;
      } else {
        base.cash.total += amount;
        base.cash.count += 1;
      }
    }

    const grand = {
      total: base.cash.total + base.transfer.total + base.card.total,
      count: base.cash.count + base.transfer.count + base.card.count,
    };

    return NextResponse.json({
      scope,
      date: toISODate(date),
      range: { from, to },
      byMethod: base,
      grand,
      sales: docs, // 🔥 lista completa para “ver lo vendido”
    });
  } catch (e: any) {
    console.error("[reports/summary] error", e);
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}
