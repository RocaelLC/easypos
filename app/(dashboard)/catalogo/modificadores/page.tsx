"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

type Ingredient = { _id: string; name: string; unit: "g" | "ml" | "pz"; stock: number; minStock: number; avgCost: number };

type ModifierOption = {
  id: string;
  name: string;
  price: number;
  ingredientId?: string;
  qty?: number;
};

type ModifierGroup = {
  _id: string;
  name: string;
  min: number;
  max: number; // 0 = sin límite
  required: boolean;
  options: ModifierOption[];
};

export default function ModificadoresPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ EDICIÓN
  const [editingId, setEditingId] = useState<string>("");        // si no está vacío => editando
  const [pickGroupId, setPickGroupId] = useState<string>("");    // selector de grupo existente para cargar

  // Form grupo
  const [gid, setGid] = useState("");
  const [gname, setGname] = useState("");
  const [gmin, setGmin] = useState(0);
  const [gmax, setGmax] = useState(0);
  const [grequired, setGrequired] = useState(false);

  // Opción (nueva)
  const [optId, setOptId] = useState("");
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState<number>(0);
  const [optIng, setOptIng] = useState<string>("");
  const [optQty, setOptQty] = useState<number>(0);

  // Opciones del grupo (editables)
  const [options, setOptions] = useState<ModifierOption[]>([]);

  const normalizeId = (v: string) =>
    v.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  async function loadAll() {
    const [g, ing] = await Promise.all([fetch("/api/modifier-groups", { cache: "no-store" }), fetch("/api/ingredients", { cache: "no-store" })]);
    const gd = await g.json();
    const id = await ing.json();
    setGroups(gd.items ?? []);
    setIngredients(id.items ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selectedIngredientNew = useMemo(
    () => ingredients.find((i) => i._id === optIng),
    [ingredients, optIng]
  );

  // --------- NUEVA OPCIÓN (add) ----------
  function addOption() {
    setMsg("");
    const oid = normalizeId(optId);
    if (!oid) return setMsg("❌ ID de opción obligatorio (ej: oreo).");
    if (!optName.trim()) return setMsg("❌ Nombre de opción obligatorio.");
    if (options.some((o) => o.id === oid)) return setMsg("❌ Ese ID de opción ya existe en el grupo.");

    const opt: ModifierOption = {
      id: oid,
      name: optName.trim(),
      price: Number(optPrice ?? 0),
      ingredientId: optIng ? String(optIng) : undefined,
      qty: optIng ? Number(optQty ?? 0) : undefined,
    };

    setOptions((prev) => [...prev, opt]);
    setOptId("");
    setOptName("");
    setOptPrice(0);
    setOptIng("");
    setOptQty(0);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  // --------- EDITAR CAMPOS DE OPCIÓN EXISTENTE ----------
  function updateOption(id: string, patch: Partial<ModifierOption>) {
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = { ...o, ...patch };

        // si quitan ingredientId, también quitar qty
        if (!next.ingredientId) {
          delete (next as any).qty;
        } else {
          next.qty = Number(next.qty ?? 0);
        }

        next.price = Number(next.price ?? 0);
        next.name = String(next.name ?? "").trim();
        return next;
      })
    );
  }

  // --------- CARGAR GRUPO PARA EDITAR ----------
  function loadGroupIntoForm(groupId: string) {
    const g = groups.find((x) => x._id === groupId);
    if (!g) return;

    setMsg("");
    setEditingId(g._id);

    setGid(g._id);
    setGname(g.name);
    setGmin(Number(g.min ?? 0));
    setGmax(Number(g.max ?? 0));
    setGrequired(Boolean(g.required));
    setOptions(Array.isArray(g.options) ? g.options : []);

    // limpiar inputs de nueva opción
    setOptId("");
    setOptName("");
    setOptPrice(0);
    setOptIng("");
    setOptQty(0);
  }

  function cancelEdit() {
    setEditingId("");
    setPickGroupId("");
    setMsg("");

    setGid("");
    setGname("");
    setGmin(0);
    setGmax(0);
    setGrequired(false);
    setOptions([]);

    setOptId("");
    setOptName("");
    setOptPrice(0);
    setOptIng("");
    setOptQty(0);
  }

  // --------- GUARDAR (crear o editar) ----------
  async function saveGroup() {
    setMsg("");
    const id = normalizeId(gid);
    if (!id) return setMsg("❌ ID de grupo obligatorio (ej: toppings).");
    if (!gname.trim()) return setMsg("❌ Nombre de grupo obligatorio.");
    if (gmin < 0) return setMsg("❌ min inválido.");
    if (gmax < 0) return setMsg("❌ max inválido.");
    if (gmax !== 0 && gmax < gmin) return setMsg("❌ max no puede ser menor que min.");

    // si estás editando, no permitir cambiar el _id (por seguridad)
    if (editingId && id !== editingId) {
      return setMsg("❌ No puedes cambiar el ID del grupo mientras editas. Cancela edición y crea otro.");
    }

    setLoading(true);
    try {
      const method = editingId ? "PATCH" : "POST"; // ✅ PATCH edita, POST crea (o upsert)
      const res = await fetch("/api/modifier-groups", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: gname.trim(),
          min: Number(gmin),
          max: Number(gmax),
          required: Boolean(grequired),
          options,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "save_failed");

      setMsg(editingId ? "✅ Grupo actualizado." : "✅ Grupo guardado.");
      await loadAll();

      // si estabas editando, recargar el mismo grupo (para reflejar normalizaciones)
      if (editingId) {
        setTimeout(() => loadGroupIntoForm(id), 0);
      } else {
        // modo crear: limpiar
        cancelEdit();
      }
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo guardar"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm(`¿Eliminar grupo "${id}"?`)) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/modifier-groups?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "delete_failed");
      setMsg("✅ Eliminado.");
      await loadAll();
      if (editingId === id) cancelEdit();
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo eliminar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Modificadores</h1>
        <p className="text-sm text-neutral-400">
          Crea grupos (Tamaño, Toppings, Leche...) y sus opciones. Ahora puedes <span className="text-neutral-200">editar</span> sin borrar.
        </p>
      </div>

      {/* ✅ Selector de grupo existente */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">Editar grupo existente</div>

        <div className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="text-xs text-neutral-400">Selecciona un grupo</label>
            <select
              value={pickGroupId}
              onChange={(e) => setPickGroupId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            >
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} ({g._id})
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={!pickGroupId}
            onClick={() => loadGroupIntoForm(pickGroupId)}
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm disabled:opacity-50"
          >
            Cargar para editar
          </button>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm"
            >
              Cancelar edición
            </button>
          )}
        </div>

        {editingId && (
          <div className="text-xs text-neutral-500">
            Editando: <span className="text-neutral-200">{editingId}</span>
          </div>
        )}
      </div>

      {/* Crear / Editar grupo */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">{editingId ? "Editar grupo" : "Nuevo grupo"}</div>

        <div className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">ID grupo</label>
            <input
              value={gid}
              onChange={(e) => setGid(e.target.value)}
              placeholder="toppings"
              disabled={!!editingId} // ✅ bloquea el ID si editas
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-50"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Normaliza: <span className="text-neutral-300">{normalizeId(gid || "…")}</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">Nombre</label>
            <input
              value={gname}
              onChange={(e) => setGname(e.target.value)}
              placeholder="Toppings"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Min</label>
            <input
              type="number"
              value={gmin}
              onChange={(e) => setGmin(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Max (0 = sin límite)</label>
            <input
              type="number"
              value={gmax}
              onChange={(e) => setGmax(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={grequired} onChange={(e) => setGrequired(e.target.checked)} />
          Requerido
        </label>

        {/* Nueva opción */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-2">
          <div className="text-sm font-medium">Agregar opción</div>

          <div className="grid md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">ID opción</label>
              <input
                value={optId}
                onChange={(e) => setOptId(e.target.value)}
                placeholder="oreo"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">Nombre</label>
              <input
                value={optName}
                onChange={(e) => setOptName(e.target.value)}
                placeholder="Oreo"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400">Precio extra</label>
              <input
                type="number"
                step="0.01"
                value={optPrice}
                onChange={(e) => setOptPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400">Insumo (opcional)</label>
              <select
                value={optIng}
                onChange={(e) => setOptIng(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              >
                <option value="">—</option>
                {ingredients.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400">Cantidad del insumo</label>
              <input
                type="number"
                step="0.01"
                value={optQty}
                onChange={(e) => setOptQty(Number(e.target.value))}
                disabled={!optIng}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 disabled:opacity-50"
              />
              {optIng && selectedIngredientNew && (
                <div className="text-xs text-neutral-500 mt-1">
                  Unidad: <span className="text-neutral-300">{selectedIngredientNew.unit}</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={addOption} className="rounded-xl border border-neutral-700 px-3 py-2 text-sm">
            + Agregar opción
          </button>
        </div>

        {/* ✅ Lista de opciones EDITABLE */}
        {options.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-neutral-300">Opciones del grupo (editable):</div>

            <div className="grid md:grid-cols-2 gap-2">
              {options.map((o) => {
                const ing = ingredients.find((i) => i._id === o.ingredientId);

                return (
                  <div key={o.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {o.id} <span className="text-xs text-neutral-500">(ID fijo)</span>
                      </div>
                      <button
                        onClick={() => removeOption(o.id)}
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-neutral-400">Nombre</label>
                        <input
                          value={o.name}
                          onChange={(e) => updateOption(o.id, { name: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-neutral-400">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(o.price ?? 0)}
                          onChange={(e) => updateOption(o.id, { price: Number(e.target.value) })}
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-neutral-400">Insumo (opcional)</label>
                        <select
                          value={o.ingredientId ?? ""}
                          onChange={(e) => updateOption(o.id, { ingredientId: e.target.value || undefined, qty: 0 })}
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        >
                          <option value="">—</option>
                          {ingredients.map((i) => (
                            <option key={i._id} value={i._id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                        </select>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-neutral-400">Cantidad del insumo</label>
                            <input
                              type="number"
                              step="0.01"
                              value={Number(o.qty ?? 0)}
                              disabled={!o.ingredientId}
                              onChange={(e) => updateOption(o.id, { qty: Number(e.target.value) })}
                              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="text-xs text-neutral-500 mt-6">
                            Unidad: <span className="text-neutral-200">{ing?.unit ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            disabled={loading}
            onClick={saveGroup}
            className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar grupo"}
          </button>

          {msg && <div className={`text-sm ${msg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{msg}</div>}
        </div>
      </div>

      {/* Lista grupos */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="font-medium">Grupos existentes</div>

        {groups.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-2">Aún no hay grupos.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {groups.map((g) => (
              <div key={g._id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {g.name} <span className="text-xs text-neutral-500">({g._id})</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      min: {g.min} · max: {g.max === 0 ? "∞" : g.max} · requerido: {g.required ? "sí" : "no"} · opciones:{" "}
                      {g.options?.length ?? 0}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadGroupIntoForm(g._id)}
                      className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteGroup(g._id)}
                      className="rounded-xl border border-red-700 text-red-300 px-3 py-2 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {g.options?.length > 0 && (
                  <div className="mt-2 grid md:grid-cols-2 gap-2">
                    {g.options.map((o) => (
                      <div key={o.id} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                        <div className="text-sm font-medium">
                          {o.name} <span className="text-xs text-neutral-500">({o.id})</span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          +{o.price} {o.ingredientId ? `· Insumo: ${o.ingredientId} (${o.qty ?? 0})` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
