"use client";
import { useEffect, useState } from "react";

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function Diario() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/daily").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-4">Cargando...</div>;

  const cards = [
    { k: "cash", t: "Efectivo" },
    { k: "transfer", t: "Transferencia" },
    { k: "card", t: "Tarjeta" },
  ] as const;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Reporte diario</h1>
      <div className="text-neutral-400 text-sm">Ventas: {data.grand.count} · Total: {money(data.grand.total)}</div>

      <div className="grid md:grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.k} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm text-neutral-400">{c.t}</div>
            <div className="text-xl font-semibold mt-1">{money(data.byMethod[c.k].total)}</div>
            <div className="text-sm text-neutral-500 mt-1">{data.byMethod[c.k].count} ventas</div>
          </div>
        ))}
      </div>
    </div>
  );
}
