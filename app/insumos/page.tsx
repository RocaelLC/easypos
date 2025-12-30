"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function InsumosPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Form
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"g" | "ml" | "pz">("g");
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [avgCost, setAvgCost] = useState<number>(0);

  const lowStock = useMemo(
    () => items.filter((i) => Number(i.stock) <= Number(i.minStock)).map((i) => i._id),
    [items]
  );

  async function load() {
    const r = await fetch("/api/ingredients");
    const d = await r.json();
    setItems(d.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function normalizeId(v: string) {
    // _id lógico: minúsculas, sin espacios, solo letras/números/guiones
    return v
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  }

  async function createIngredient() {
    setMsg("");
    const safeId = normalizeId(id);

    if (!safeId) return setMsg("❌ El ID es obligatorio (ej: fresas, leche-entera).");
    if (!name.trim()) return setMsg("❌ El nombre es obligatorio.");

    setLoading(true);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: safeId,
          name: name.trim(),
          unit,
          stock: Number(stock),
          minStock: Number(minStock),
          avgCost: Number(avgCost),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "create_failed");

      setMsg("✅ Insumo guardado.");
      setId("");
      setName("");
      setUnit("g");
      setStock(0);
      setMinStock(0);
      setAvgCost(0);
      await load();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo guardar"));
    } finally {
      setLoading(false);
    }
  }

  async function removeIngredient(ingredientId: string) {
    if (!confirm(`¿Eliminar "${ingredientId}"?`)) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/ingredients?id=${encodeURIComponent(ingredientId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "delete_failed");
      setMsg("✅ Eliminado.");
      await load();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo eliminar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Insumos</h1>
        <p className="text-sm text-neutral-400">
          Crea y administra tus insumos (inventario base). Usa IDs lógicos: <span className="text-neutral-200">fresas</span>,{" "}
          <span className="text-neutral-200">leche-entera</span>, <span className="text-neutral-200">vaso-12oz</span>.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">Nuevo insumo</div>

        <div className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">ID (único)</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ej: fresas, crema, vaso-12oz"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Se normaliza a: <span className="text-neutral-300">{normalizeId(id || "…")}</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fresas"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Unidad</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="pz">pz</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Stock inicial</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Mínimo</label>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Costo prom. por unidad</label>
            <input
              type="number"
              value={avgCost}
              step="0.01"
              onChange={(e) => setAvgCost(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            disabled={loading}
            onClick={createIngredient}
            className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar insumo"}
          </button>

          {msg && (
            <div className={`text-sm ${msg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{msg}</div>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Lista</div>
          <button onClick={load} className="text-sm text-neutral-300 hover:text-white">
            Refrescar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-2">Aún no hay insumos. Crea el primero arriba.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {items.map((i) => {
              const isLow = lowStock.includes(i._id);
              return (
                <div
                  key={i._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{i.name}</span>
                      <span className="text-xs text-neutral-500">(_id: {i._id})</span>
                      {isLow && (
                        <span className="text-xs rounded-full border border-yellow-600 text-yellow-300 px-2 py-0.5">
                          Bajo stock
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      Stock: <span className="text-neutral-200">{i.stock}</span> {i.unit} · Mínimo:{" "}
                      <span className="text-neutral-200">{i.minStock}</span> · Costo prom:{" "}
                      <span className="text-neutral-200">{money(i.avgCost)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href="/compras"
                      className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
                    >
                      Comprar
                    </a>
                    <button
                      onClick={() => removeIngredient(i._id)}
                      className="rounded-xl border border-red-700 text-red-300 px-3 py-2 text-sm hover:bg-red-500/10"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
