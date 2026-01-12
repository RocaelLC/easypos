"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createPurchase } from "@/lib/purchasesService";
import MobileTopBar from "@/components/MobileTopBar";

type Ingredient = {
  _id: string;
  name: string;
  unit: "g" | "ml" | "pz";
  stock: number;
  minStock: number;
  avgCost: number;
};

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function ComprasPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientId, setIngredientId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [cart, setCart] = useState<
    Array<{ ingredientId: string; name: string; unit: string; qty: number; unitCost: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // ✅ NUEVO: meta para cartera
  const [payMethod, setPayMethod] = useState<"cash" | "transfer" | "card">("cash");
  const [payState, setPayState] = useState<"available" | "pending">("available");
  const [category, setCategory] = useState("Insumos");
  const [supplier, setSupplier] = useState("");

  async function loadIngredients() {
    const r = await fetch("/api/ingredients", { cache: "no-store" });
    const d = await r.json();
    setIngredients(d.items ?? []);
  }

  useEffect(() => {
    loadIngredients();
  }, []);

  const selected = useMemo(
    () => ingredients.find((i) => i._id === ingredientId),
    [ingredients, ingredientId]
  );

  const total = useMemo(() => cart.reduce((s, it) => s + it.qty * it.unitCost, 0), [cart]);

  function addLine() {
    setMsg("");
    if (!selected) return setMsg("Selecciona un insumo.");
    if (!qty || qty <= 0) return setMsg("Cantidad inválida.");
    if (!unitCost || unitCost <= 0) return setMsg("Costo unitario inválido.");

    setCart((prev) => {
      const idx = prev.findIndex((p) => p.ingredientId === selected._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + qty,
          unitCost,
        };
        return next;
      }
      return [
        ...prev,
        {
          ingredientId: selected._id,
          name: selected.name,
          unit: selected.unit,
          qty,
          unitCost,
        },
      ];
    });

    setQty(1);
    setUnitCost(0);
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((x) => x.ingredientId !== id));
  }

  async function savePurchase() {
    setMsg("");
    if (!cart.length) return setMsg("Agrega al menos 1 insumo a la compra.");

    // ✅ Reglas simples:
    // - efectivo siempre available
    // - transfer/card pueden ser pending si quieres registrarlo como "por pagar"
    const stateToSend = payMethod === "cash" ? "available" : payState;

    setLoading(true);
    try {
      await createPurchase(
        cart.map((c) => ({ ingredientId: c.ingredientId, qty: c.qty, unitCost: c.unitCost })),
        {
          method: payMethod,
          state: stateToSend,
          category: category.trim() || "Insumos",
          supplier: supplier.trim(),
        }
      );

      setCart([]);
      setMsg("✅ Compra registrada, stock actualizado y cartera descontada.");
      await loadIngredients();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo registrar la compra"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Compras</h1>
        <p className="text-sm text-neutral-400">
          Registra compras de insumos (sube stock y descuenta cartera).
        </p>
      </div>

      {/* ✅ META (método/categoría/proveedor) */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">Información del gasto</div>

        <div className="grid md:grid-cols-4 gap-2">
          <div>
            <label className="text-sm text-neutral-400">Método de pago</label>
            <select
              value={payMethod}
              onChange={(e) => {
                const v = e.target.value as "cash" | "transfer" | "card";
                setPayMethod(v);
                if (v === "cash") setPayState("available"); // efectivo no puede ser pendiente
              }}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-neutral-400">Estado</label>
            <select
              value={payMethod === "cash" ? "available" : payState}
              onChange={(e) => setPayState(e.target.value as any)}
              disabled={payMethod === "cash"}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-60"
            >
              <option value="available">Disponible</option>
              <option value="pending">Pendiente</option>
            </select>
            {payMethod === "cash" && (
              <div className="mt-1 text-[11px] text-neutral-500">Efectivo siempre es disponible.</div>
            )}
          </div>

          <div>
            <label className="text-sm text-neutral-400">Categoría</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
              placeholder="Insumos, Gas, Renta..."
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400">Proveedor (opcional)</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
              placeholder="Costco, Sam’s..."
            />
          </div>
        </div>
      </div>

      {/* LÍNEAS DE COMPRA */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-2">
          <div className="md:col-span-2">
            <label className="text-sm text-neutral-400">Insumo</label>
            <select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            >
              <option value="">Selecciona…</option>
              {ingredients.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.unit}) — stock: {i.stock}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-neutral-400">Cantidad</label>
            <input
              type="number"
              value={qty}
              min={0}
              step="1"
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400">Costo unitario</label>
            <input
              type="number"
              value={unitCost}
              min={0}
              step="0.01"
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={addLine} className="rounded-xl border border-neutral-700 px-4 py-2">
            + Agregar a compra
          </button>

          <div className="ml-auto text-sm text-neutral-400 flex items-center">
            Total compra: <span className="ml-2 text-neutral-200 font-medium">{money(total)}</span>
          </div>
        </div>

        {msg && (
          <div className="text-sm">
            <span className={msg.startsWith("✅") ? "text-green-400" : "text-red-400"}>{msg}</span>
          </div>
        )}
      </div>

      {/* DETALLE */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="font-medium">Detalle</div>

        {!cart.length ? (
          <div className="text-sm text-neutral-400 mt-2">Aún no agregas insumos a esta compra.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {cart.map((c) => (
              <div
                key={c.ingredientId}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-neutral-400">
                    {c.qty} {c.unit} × {money(c.unitCost)} ={" "}
                    <span className="text-neutral-200">{money(c.qty * c.unitCost)}</span>
                  </div>
                </div>
                <button onClick={() => removeLine(c.ingredientId)} className="text-sm text-red-400 hover:text-red-300">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            disabled={loading || !cart.length}
            onClick={savePurchase}
            className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar compra"}
          </button>

          <button
            disabled={loading}
            onClick={() => setCart([])}
            className="rounded-xl border border-neutral-700 px-4 py-2 disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      </div>
       return (
    <>
      <MobileTopBar title="Cartera" backTo="/dashboard" /> 
      {/* resto de la página */}
    </>
  );

    </div>
  );
}
