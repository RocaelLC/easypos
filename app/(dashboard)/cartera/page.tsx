"use client";

import { useEffect, useMemo, useState } from "react";

import MobileTopBar from "@/components/MobileTopBar";

type PaymentMethod = "cash" | "transfer" | "card";
type WalletState = "available" | "pending";

type Summary = {
  
  byMethod: Record<PaymentMethod, Record<WalletState, number>>;
  availableTotal: number;
  pendingTotal: number;
  bankSubtotal: { available: number; pending: number; total: number };
};

type Movement = {
  _id: string;
  amount: number;
  direction: "in" | "out";
  method: PaymentMethod;
  state: WalletState;
  kind: string;
  category?: string;
  supplier?: string;
  note?: string;
  origin?: { type: string; refId?: string };
  createdAt: string;
  createdByEmail?: string;
  createdByUid?: string;
};

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
}

function methodLabel(m: PaymentMethod) {
  if (m === "cash") return "Efectivo";
  if (m === "transfer") return "Transferencia";
  return "Tarjeta";
}

function stateLabel(s: WalletState) {
  return s === "pending" ? "Pendiente" : "Disponible";
}

function kindLabel(k: string) {
  switch (k) {
    case "sale": return "Venta";
    case "expense": return "Gasto";
    case "manual": return "Movimiento";
    case "cash_count": return "Corte";
    case "adjustment": return "Ajuste";
    case "settlement": return "Liquidación";
    default: return k || "Movimiento";
  }
}

export default function CarteraPage() {
  
  const [summary, setSummary] = useState<Summary | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const [mDirection, setMDirection] = useState<"in" | "out">("in");
  const [mKind, setMKind] = useState<"manual" | "adjustment">("manual");
  const [mMethod, setMMethod] = useState<PaymentMethod>("cash");
  const [mState, setMState] = useState<WalletState>("available");
  const [mAmount, setMAmount] = useState<number>(0);
  const [mNote, setMNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string>("");

  const [openDetail, setOpenDetail] = useState(true);

  const [items, setItems] = useState<Movement[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  async function loadSummary() {
    const res = await fetch("/api/wallet/summary", { cache: "no-store" });
    const data = await res.json();
    setSummary(data);
  }

  async function loadMovements(reset = false) {
    setLoadingList(true);
    try {
      const url = new URL("/api/wallet/movements", window.location.origin);
      url.searchParams.set("limit", "50");
      if (!reset && cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      const newItems: Movement[] = Array.isArray(data?.items) ? data.items : [];
      const nextCursor: string | null = data?.nextCursor ?? null;

      if (reset) setItems(newItems);
      else setItems((prev) => [...prev, ...newItems]);

      setCursor(nextCursor);
    } finally {
      setLoadingList(false);
    }
  }
  async function saveManual() {
    setFormMsg("");

    if (!mNote.trim()) {
      setFormMsg("❌ La nota es obligatoria.");
      return;
    }
    if (!Number.isFinite(mAmount) || mAmount <= 0) {
      setFormMsg("❌ Monto inválido.");
      return;
    }

    // regla simple: efectivo no debería ser pendiente (lo forzamos a available)
    const stateToSend: WalletState = mMethod === "cash" ? "available" : mState;

    setSaving(true);
    try {
      const res = await fetch("/api/wallet/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: mDirection,
          kind: mKind,
          amount: Number(mAmount),
          method: mMethod,
          state: stateToSend,
          note: mNote.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "save_failed");

      setManualOpen(false);

      // reset form
      setMDirection("in");
      setMKind("manual");
      setMMethod("cash");
      setMState("available");
      setMAmount(0);
      setMNote("");
      setFormMsg("");

      await loadSummary();
      await loadMovements(true);
    } catch (e: any) {
      setFormMsg("❌ Error: " + (e?.message ?? "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSummary();
    loadMovements(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detail = useMemo(() => {
    if (!summary) return null;
    const cash = summary.byMethod.cash;
    const transfer = summary.byMethod.transfer;
    const card = summary.byMethod.card;

    return {
      cashAvailable: cash.available,
      cashPending: cash.pending,
      transferAvailable: transfer.available,
      transferPending: transfer.pending,
      cardAvailable: card.available,
      cardPending: card.pending,
      bankAvail: summary.bankSubtotal.available,
      bankPend: summary.bankSubtotal.pending,
      bankTotal: summary.bankSubtotal.total,
    };
  }, [summary]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header fijo */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Cartera</h1>
              <p className="text-xs text-neutral-400">
                La verdad financiera: solo cambia por movimientos (ventas, gastos, manuales y cortes).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualOpen(true)}
                className="rounded-xl bg-green-500 text-black px-3 py-2 text-sm font-medium hover:opacity-95"
              >
                + Movimiento
              </button>

              <button
                onClick={() => loadSummary().then(() => loadMovements(true))}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
              >
                Actualizar
              </button>
            </div>

          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-400">Total disponible</div>
              <div className="mt-1 text-3xl font-semibold">
                {money(summary?.availableTotal ?? 0)}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-400">Pendiente</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-200">
                {money(summary?.pendingTotal ?? 0)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                (Tarjeta / Transferencia por liquidar)
              </div>
            </div>
          </div>

          {/* Desglose */}
          <button
            onClick={() => setOpenDetail((v) => !v)}
            className="mt-3 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left hover:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Detalle por método</div>
              <div className="text-xs text-neutral-400">{openDetail ? "Ocultar" : "Mostrar"}</div>
            </div>

            {openDetail && detail && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <div className="text-xs text-neutral-400">Efectivo</div>
                  <div className="mt-1 font-semibold">{money(detail.cashAvailable)}</div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <div className="text-xs text-neutral-400">Transferencia</div>
                  <div className="mt-1 font-semibold">{money(detail.transferAvailable)}</div>
                  <div className="text-xs text-neutral-500">Pendiente: {money(detail.transferPending)}</div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <div className="text-xs text-neutral-400">Tarjeta</div>
                  <div className="mt-1 font-semibold">{money(detail.cardAvailable)}</div>
                  <div className="text-xs text-neutral-500">Pendiente: {money(detail.cardPending)}</div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <div className="text-xs text-neutral-400">Subtotal banco</div>
                  <div className="mt-1 font-semibold">{money(detail.bankTotal)}</div>
                  <div className="text-xs text-neutral-500">
                    Disp: {money(detail.bankAvail)} · Pend: {money(detail.bankPend)}
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Movimientos</h2>
          <div className="text-xs text-neutral-500">Todo queda registrado. No hay edición de saldo.</div>
        </div>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
              Aún no hay movimientos.
            </div>
          ) : (
            items.map((m) => {
              const sign = m.direction === "in" ? "+" : "-";
              const amount = money(m.amount);
              const badge =
                m.direction === "in"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-700/40"
                  : "bg-rose-500/15 text-rose-300 border-rose-700/40";

              return (
                <div key={m._id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {kindLabel(m.kind)} · {methodLabel(m.method)} ({stateLabel(m.state)})
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {new Date(m.createdAt).toLocaleString("es-MX")}
                        {m.createdByEmail ? ` · ${m.createdByEmail}` : ""}
                      </div>
                      {(m.category || m.supplier || m.note) && (
                        <div className="mt-2 text-xs text-neutral-300 space-y-1">
                          {m.category && <div>Categoría: {m.category}</div>}
                          {m.supplier && <div>Proveedor: {m.supplier}</div>}
                          {m.note && <div>Nota: {m.note}</div>}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${badge}`}>
                      {sign}{amount}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5">
          <button
            disabled={!cursor || loadingList}
            onClick={() => loadMovements(false)}
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 py-3 text-sm hover:bg-neutral-900 disabled:opacity-50"
          >
            {loadingList ? "Cargando..." : cursor ? "Cargar más" : "No hay más"}
          </button>
        </div>
      </div>
      {manualOpen && (
  <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60">
    <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl bg-neutral-950 border border-neutral-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Registrar movimiento</div>
          <div className="text-xs text-neutral-400">
            La cartera no se edita directo; esto genera un movimiento con rastro.
          </div>
        </div>
        <button
          onClick={() => setManualOpen(false)}
          className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-neutral-400">Tipo</label>
          <select
            value={mDirection}
            onChange={(e) => setMDirection(e.target.value as any)}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <option value="in">Ingreso (+)</option>
            <option value="out">Egreso (-)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">Clasificación</label>
          <select
            value={mKind}
            onChange={(e) => setMKind(e.target.value as any)}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <option value="manual">Manual</option>
            <option value="adjustment">Ajuste</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">Método</label>
          <select
            value={mMethod}
            onChange={(e) => {
              const v = e.target.value as PaymentMethod;
              setMMethod(v);
              if (v === "cash") setMState("available");
            }}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="card">Tarjeta</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">Estado</label>
          <select
            value={mMethod === "cash" ? "available" : mState}
            onChange={(e) => setMState(e.target.value as WalletState)}
            disabled={mMethod === "cash"}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-60"
          >
            <option value="available">Disponible</option>
            <option value="pending">Pendiente</option>
          </select>
          {mMethod === "cash" && (
            <div className="mt-1 text-[11px] text-neutral-500">
              Efectivo siempre se considera disponible.
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="text-xs text-neutral-400">Monto</label>
          <input
            type="number"
            step="0.01"
            value={mAmount || ""}
            onChange={(e) => setMAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            placeholder="0.00"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-neutral-400">Nota (obligatoria)</label>
          <input
            value={mNote}
            onChange={(e) => setMNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            placeholder='Ej: "Retiro personal", "Meter cambio", "Ajuste por diferencia"...'
          />
        </div>
      </div>

      {formMsg && (
        <div className={`mt-3 text-sm ${formMsg.startsWith("❌") ? "text-red-400" : "text-emerald-300"}`}>
          {formMsg}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setManualOpen(false)}
          className="flex-1 rounded-xl border border-neutral-700 py-2"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          onClick={saveManual}
          className="flex-1 rounded-xl bg-green-500 text-black py-2 font-medium disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  </div>
)}
return (
    <>
      <MobileTopBar title="Cartera" backTo="/dashboard" />
      {/* resto de la página */}
    </>
  );
    </div>
  );
  
}
