"use client";
export const dynamic = "force-dynamic";

import MobileTopBar from "@/components/MobileTopBar";
import { useEffect, useMemo, useState } from "react";

type ModifierGroup = { _id: string; name: string };
type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  modifierGroupIds: string[];
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // form
  const [pid, setPid] = useState("");
  const [pname, setPname] = useState("");
  const [pprice, setPprice] = useState<number>(0);
  const [pcat, setPcat] = useState("general");
  const [pactive, setPactive] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const normalizeId = (v: string) =>
    v.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  async function loadAll() {
    const [p, g] = await Promise.all([fetch("/api/products"), fetch("/api/modifier-groups")]);
    const pd = await p.json();
    const gd = await g.json();
    setProducts(pd.items ?? []);
    setGroups(gd.items ?? []);
  }

  useEffect(() => { loadAll(); }, []);

  const canSave = useMemo(() => normalizeId(pid) && pname.trim(), [pid, pname]);

  function toggleGroup(id: string) {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function saveProduct() {
    setMsg("");
    const id = normalizeId(pid);
    if (!id) return setMsg("❌ ID obligatorio (ej: fresas-base).");
    if (!pname.trim()) return setMsg("❌ Nombre obligatorio.");

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: pname.trim(),
          price: Number(pprice ?? 0),
          category: pcat.trim() || "general",
          active: Boolean(pactive),
          modifierGroupIds: selectedGroups,
          recipe: [], // luego lo conectamos con inventario (receta base)
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "save_failed");

      setMsg("✅ Producto guardado.");
      setPid(""); setPname(""); setPprice(0); setPcat("general"); setPactive(true); setSelectedGroups([]);
      await loadAll();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo guardar"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm(`¿Eliminar producto "${id}"?`)) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "delete_failed");
      setMsg("✅ Eliminado.");
      await loadAll();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo eliminar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-neutral-400">
          Crea productos y asígnales grupos de modificadores (Tamaño, Toppings, etc.).
        </p>
      </div>

      {/* Crear producto */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">Nuevo producto</div>

        <div className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">ID producto</label>
            <input value={pid} onChange={(e)=>setPid(e.target.value)} placeholder="fresas-base"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" />
            <div className="text-xs text-neutral-500 mt-1">Normaliza: <span className="text-neutral-300">{normalizeId(pid || "…")}</span></div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">Nombre</label>
            <input value={pname} onChange={(e)=>setPname(e.target.value)} placeholder="Fresas con crema"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Precio</label>
            <input type="number" step="0.01" value={pprice} onChange={(e)=>setPprice(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Categoría</label>
            <input value={pcat} onChange={(e)=>setPcat(e.target.value)} placeholder="postres / frappes"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={pactive} onChange={(e)=>setPactive(e.target.checked)} />
          Activo
        </label>

        {/* Asignar grupos */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <div className="text-sm font-medium">Grupos de modificadores</div>
          {groups.length === 0 ? (
            <div className="text-sm text-neutral-400 mt-2">
              Aún no hay grupos. Crea primero en “Modificadores”.
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {groups.map(g => {
                const on = selectedGroups.includes(g._id);
                return (
                  <button
                    key={g._id}
                    onClick={() => toggleGroup(g._id)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on ? "border-green-500 bg-green-500/10" : "border-neutral-700"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={loading || !canSave}
            onClick={saveProduct}
            className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar producto"}
          </button>

          {msg && <div className={`text-sm ${msg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{msg}</div>}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="font-medium">Listado</div>

        {products.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-2">Aún no hay productos.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {products.map(p => (
              <div key={p._id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{p.name} <span className="text-xs text-neutral-500">(_id: {p._id})</span>
</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    ${p.price} · {p.category} · {p.active ? "activo" : "inactivo"} · grupos: {p.modifierGroupIds?.length ?? 0}
                  </div>
                </div>
                <button onClick={() => deleteProduct(p._id)} className="rounded-xl border border-red-700 text-red-300 px-3 py-2 text-sm">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
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
