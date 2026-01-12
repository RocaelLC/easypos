"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

type Method = "cash" | "transfer" | "card";

type SaleDoc = {
  _id?: any;
  clientSaleId?: string;
  createdAt?: string | Date;
  total?: number;
  paymentMethod?: Method;
  items?: Array<{ name?: string; qty?: number; price?: number }>;
};

type Summary = {
  scope: "day" | "month" | "year";
  date: string; // YYYY-MM-DD
  byMethod: Record<Method, { total: number; count: number }>;
  grand: { total: number; count: number };
  sales: SaleDoc[];
};

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyTime(v: any) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function prettyDateTime(v: any) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function methodLabel(m?: Method) {
  if (m === "transfer") return "Transferencia";
  if (m === "card") return "Tarjeta";
  return "Efectivo";
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60 p-3">
      <div className="w-full md:max-w-3xl rounded-2xl bg-neutral-950 border border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-xl border border-neutral-700 px-3 py-1.5 text-sm">
            Cerrar
          </button>
        </div>
        <div className="p-4 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function SalesTable({ sales, onOpen }: { sales: SaleDoc[]; onOpen: (s: SaleDoc) => void }) {
  if (!sales.length) return <div className="text-sm text-neutral-400 mt-2">No hay ventas en este periodo.</div>;

  return (
    <div className="mt-3 space-y-2">
      {sales.map((s, idx) => {
        const id = String(s.clientSaleId ?? s._id ?? idx);
        return (
          <button
            key={id}
            onClick={() => onOpen(s)}
            className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 hover:bg-neutral-900/70"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {prettyDateTime(s.createdAt)} · {methodLabel(s.paymentMethod)}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {s.items?.length ? `${s.items.length} items` : "—"}
                </div>
              </div>
              <div className="text-sm font-semibold">{money(Number(s.total ?? 0))}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function ReporteDiario() {
  const [dayDate, setDayDate] = useState<string>(() => ymd(new Date())); // hoy por default
  const [dayData, setDayData] = useState<any>(null); // usa /api/reports/daily
  const [monthData, setMonthData] = useState<Summary | null>(null);
  const [yearData, setYearData] = useState<Summary | null>(null);

  const [openScope, setOpenScope] = useState<"day" | "month" | "year" | null>(null);
  const [openSale, setOpenSale] = useState<SaleDoc | null>(null);

  async function loadAll() {
    // Día (compatible con tu endpoint existente)
    const d = await fetch(`/api/reports/daily?date=${encodeURIComponent(dayDate)}`, { cache: "no-store" }).then((r) => r.json());
    setDayData(d);

    // Mes / Año (nuevo endpoint summary)
    const m = await fetch(`/api/reports/summary?scope=month&date=${encodeURIComponent(dayDate)}`, { cache: "no-store" }).then((r) => r.json());
    const y = await fetch(`/api/reports/summary?scope=year&date=${encodeURIComponent(dayDate)}`, { cache: "no-store" }).then((r) => r.json());
    setMonthData(m);
    setYearData(y);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayDate]);

  const daySummary = useMemo(() => {
    if (!dayData?.byMethod) return null;
    const grand = dayData?.grand ?? { total: 0, count: 0 };
    return {
      scope: "day" as const,
      date: dayDate,
      byMethod: dayData.byMethod,
      grand,
      sales: Array.isArray(dayData.sales) ? (dayData.sales as SaleDoc[]) : [],
    };
  }, [dayData, dayDate]);

  if (!daySummary) return <div className="p-4">Cargando...</div>;

  const cards = [
    {
      key: "day" as const,
      title: "Ventas del día",
      subtitle: dayDate === ymd(new Date()) ? "Hoy" : `Fecha: ${dayDate}`,
      total: daySummary.grand.total,
      count: daySummary.grand.count,
    },
    {
      key: "month" as const,
      title: "Ventas del mes",
      subtitle: "Acumulado del mes",
      total: monthData?.grand.total ?? 0,
      count: monthData?.grand.count ?? 0,
    },
    {
      key: "year" as const,
      title: "Ventas del año",
      subtitle: "Acumulado del año",
      total: yearData?.grand.total ?? 0,
      count: yearData?.grand.count ?? 0,
    },
  ];

  function scopeData(scope: "day" | "month" | "year"): Summary {
    if (scope === "day") return daySummary ?? ({ scope: "day", date: dayDate, byMethod: { cash: { total: 0, count: 0 }, transfer: { total: 0, count: 0 }, card: { total: 0, count: 0 } }, grand: { total: 0, count: 0 }, sales: [] } as any);
    if (scope === "month") return monthData ?? ({ scope: "month", date: dayDate, byMethod: { cash: { total: 0, count: 0 }, transfer: { total: 0, count: 0 }, card: { total: 0, count: 0 } }, grand: { total: 0, count: 0 }, sales: [] } as any);
    return yearData ?? ({ scope: "year", date: dayDate, byMethod: { cash: { total: 0, count: 0 }, transfer: { total: 0, count: 0 }, card: { total: 0, count: 0 } }, grand: { total: 0, count: 0 }, sales: [] } as any);
  }

  const methodTiles = [
    { k: "cash" as const, t: "Efectivo" },
    { k: "transfer" as const, t: "Transferencia" },
    { k: "card" as const, t: "Tarjeta" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reporte diario</h1>
          <div className="text-neutral-400 text-sm">
            Ventas: {daySummary.grand.count} · Total: {money(daySummary.grand.total)}
          </div>
        </div>

        {/* Selector rápido: hoy / ayer + fecha */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDayDate(ymd(new Date()))}
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setDayDate(ymd(d));
            }}
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Ayer
          </button>

          <input
            type="date"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
          />

          <button
            onClick={loadAll}
            className="rounded-xl bg-green-500 text-black px-3 py-2 text-sm font-medium"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* GRID 3: día / mes / año */}
      <div className="grid md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.key} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-neutral-300">{c.title}</div>
                <div className="text-xs text-neutral-500 mt-1">{c.subtitle}</div>
              </div>
              <button
                onClick={() => setOpenScope(c.key)}
                className="rounded-xl border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
              >
                Previsualizar
              </button>
            </div>

            <div className="text-2xl font-semibold mt-3">{money(c.total)}</div>
            <div className="text-sm text-neutral-500 mt-1">{c.count} ventas</div>
          </div>
        ))}
      </div>

      {/* Resumen por método (como ya lo tienes, pero mantenemos) */}
      <div className="grid md:grid-cols-3 gap-3">
        {methodTiles.map((m) => (
          <div key={m.k} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm text-neutral-400">{m.t}</div>
            <div className="text-xl font-semibold mt-1">{money(daySummary.byMethod[m.k].total)}</div>
            <div className="text-sm text-neutral-500 mt-1">{daySummary.byMethod[m.k].count} ventas</div>
          </div>
        ))}
      </div>

      {/* Lista de ventas del día en la página */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Ventas del día</div>
          <div className="text-xs text-neutral-500">
            Tip: clic en una venta para ver detalles
          </div>
        </div>

        <SalesTable sales={daySummary.sales} onOpen={(s) => setOpenSale(s)} />
      </div>

      {/* Modal: Previsualizar por periodo */}
      {openScope && (
        <Modal
          title={
            openScope === "day" ? `Ventas del día (${dayDate})` :
            openScope === "month" ? "Ventas del mes" : "Ventas del año"
          }
          onClose={() => setOpenScope(null)}
        >
          {(() => {
            const s = scopeData(openScope);
            const bankTotal = (s.byMethod.transfer.total ?? 0) + (s.byMethod.card.total ?? 0);

            return (
              <div className="space-y-4">
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="text-xs text-neutral-400">Total</div>
                    <div className="text-lg font-semibold mt-1">{money(s.grand.total)}</div>
                    <div className="text-xs text-neutral-500 mt-1">{s.grand.count} ventas</div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="text-xs text-neutral-400">Efectivo</div>
                    <div className="text-lg font-semibold mt-1">{money(s.byMethod.cash.total)}</div>
                    <div className="text-xs text-neutral-500 mt-1">{s.byMethod.cash.count} ventas</div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="text-xs text-neutral-400">Transferencia</div>
                    <div className="text-lg font-semibold mt-1">{money(s.byMethod.transfer.total)}</div>
                    <div className="text-xs text-neutral-500 mt-1">{s.byMethod.transfer.count} ventas</div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="text-xs text-neutral-400">Tarjeta</div>
                    <div className="text-lg font-semibold mt-1">{money(s.byMethod.card.total)}</div>
                    <div className="text-xs text-neutral-500 mt-1">{s.byMethod.card.count} ventas</div>
                  </div>
                </div>

                <div className="text-sm text-neutral-400">
                  Subtotal banco (Transferencia + Tarjeta): <span className="text-neutral-200 font-medium">{money(bankTotal)}</span>
                </div>

                <div className="border-t border-neutral-800 pt-3">
                  <div className="font-medium">Ventas</div>
                  <SalesTable sales={s.sales ?? []} onOpen={(sale) => setOpenSale(sale)} />
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Modal: Detalle de una venta */}
      {openSale && (
        <Modal title="Detalle de venta" onClose={() => setOpenSale(null)}>
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
              <div className="text-sm font-medium">
                {prettyDateTime(openSale.createdAt)} · {methodLabel(openSale.paymentMethod)}
              </div>
              <div className="text-sm text-neutral-400 mt-1">
                Total: <span className="text-neutral-200 font-semibold">{money(Number(openSale.total ?? 0))}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                ID: {String(openSale.clientSaleId ?? openSale._id ?? "—")}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="font-medium">Productos</div>

              {!openSale.items?.length ? (
                <div className="text-sm text-neutral-400 mt-2">Esta venta no trae items guardados.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {openSale.items.map((it, i) => (
                    <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{it.name ?? "Producto"}</div>
                        <div className="text-sm">{money(Number(it.price ?? 0))}</div>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Cantidad: {Number(it.qty ?? 1)} · Subtotal:{" "}
                        <span className="text-neutral-200">
                          {money(Number(it.price ?? 0) * Number(it.qty ?? 1))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-neutral-500">
              Nota: si quieres mostrar modificadores en el detalle, hay que guardar en la venta las selections/modifiers
              del cart (ahorita tu checkout solo manda name/qty/price).
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
