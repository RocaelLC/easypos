"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { safeFetchJSON } from "@/lib/safeFetchJSON";

type Ingredient = {
  _id: string;
  name: string;
  unit: "g" | "ml" | "pz";
  stock: number;
  minStock: number;
  avgCost: number;
};

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
  max: number;
  required: boolean;
  options: ModifierOption[];
};

export default function ModificadoresPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [editingId, setEditingId] = useState<string>("");
  const [pickGroupId, setPickGroupId] = useState<string>("");

  const [gid, setGid] = useState("");
  const [gname, setGname] = useState("");
  const [gmin, setGmin] = useState(0);
  const [gmax, setGmax] = useState(0);
  const [grequired, setGrequired] = useState(false);

  const [optId, setOptId] = useState("");
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState<number>(0);
  const [optIng, setOptIng] = useState<string>("");
  const [optQty, setOptQty] = useState<number>(0);

  const [options, setOptions] = useState<ModifierOption[]>([]);

  const normalizeId = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  async function loadAll() {
    const [groupsData, ingredientsData] = await Promise.all([
      safeFetchJSON<{ items?: ModifierGroup[] }>("/api/modifier-groups", { cache: "no-store" }),
      safeFetchJSON<{ items?: Ingredient[] }>("/api/ingredients", { cache: "no-store" }),
    ]);

    setGroups(groupsData?.items ?? []);
    setIngredients(ingredientsData?.items ?? []);
  }

  useEffect(() => {
    loadAll().catch((error) => {
      console.error("Error loading modifier groups:", error);
      setGroups([]);
      setIngredients([]);
    });
  }, []);

  const selectedIngredientNew = useMemo(
    () => ingredients.find((ingredient) => ingredient._id === optIng),
    [ingredients, optIng]
  );

  function addOption() {
    setMsg("");
    const oid = normalizeId(optId);
    if (!oid) return setMsg("❌ ID de opcion obligatorio (ej: oreo).");
    if (!optName.trim()) return setMsg("❌ Nombre de opcion obligatorio.");
    if (options.some((option) => option.id === oid)) {
      return setMsg("❌ Ese ID de opcion ya existe en el grupo.");
    }

    const option: ModifierOption = {
      id: oid,
      name: optName.trim(),
      price: Number(optPrice ?? 0),
      ingredientId: optIng ? String(optIng) : undefined,
      qty: optIng ? Number(optQty ?? 0) : undefined,
    };

    setOptions((prev) => [...prev, option]);
    setOptId("");
    setOptName("");
    setOptPrice(0);
    setOptIng("");
    setOptQty(0);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  }

  function updateOption(id: string, patch: Partial<ModifierOption>) {
    setOptions((prev) =>
      prev.map((option) => {
        if (option.id !== id) return option;
        const next = { ...option, ...patch };

        if (!next.ingredientId) {
          delete (next as ModifierOption).qty;
        } else {
          next.qty = Number(next.qty ?? 0);
        }

        next.price = Number(next.price ?? 0);
        next.name = String(next.name ?? "").trim();
        return next;
      })
    );
  }

  function loadGroupIntoForm(groupId: string) {
    const group = groups.find((item) => item._id === groupId);
    if (!group) return;

    setMsg("");
    setEditingId(group._id);
    setGid(group._id);
    setGname(group.name);
    setGmin(Number(group.min ?? 0));
    setGmax(Number(group.max ?? 0));
    setGrequired(Boolean(group.required));
    setOptions(Array.isArray(group.options) ? group.options : []);

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

  async function saveGroup() {
    setMsg("");
    const id = normalizeId(gid);
    if (!id) return setMsg("❌ ID de grupo obligatorio (ej: toppings).");
    if (!gname.trim()) return setMsg("❌ Nombre de grupo obligatorio.");
    if (gmin < 0) return setMsg("❌ min invalido.");
    if (gmax < 0) return setMsg("❌ max invalido.");
    if (gmax !== 0 && gmax < gmin) return setMsg("❌ max no puede ser menor que min.");

    if (editingId && id !== editingId) {
      return setMsg("❌ No puedes cambiar el ID del grupo mientras editas. Cancela edicion y crea otro.");
    }

    setLoading(true);
    try {
      const method = editingId ? "PATCH" : "POST";
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

      const text = await res.text();
      let data: { error?: string } | null = null;

      try {
        data = text ? (JSON.parse(text) as { error?: string }) : null;
      } catch {
        throw new Error(`Respuesta no valida en /api/modifier-groups: ${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data?.error ?? "save_failed");

      setMsg(editingId ? "✅ Grupo actualizado." : "✅ Grupo guardado.");
      await loadAll();

      if (editingId) {
        setTimeout(() => loadGroupIntoForm(id), 0);
      } else {
        cancelEdit();
      }
    } catch (error: unknown) {
      setMsg("❌ Error: " + (error instanceof Error ? error.message : "No se pudo guardar"));
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
      const text = await res.text();
      let data: { error?: string } | null = null;

      try {
        data = text ? (JSON.parse(text) as { error?: string }) : null;
      } catch {
        throw new Error(`Respuesta no valida en /api/modifier-groups: ${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data?.error ?? "delete_failed");
      setMsg("✅ Eliminado.");
      await loadAll();
      if (editingId === id) cancelEdit();
    } catch (error: unknown) {
      setMsg("❌ Error: " + (error instanceof Error ? error.message : "No se pudo eliminar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Modificadores</h1>
        <p className="text-sm text-neutral-400">
          Crea grupos (Tamano, Toppings, Leche...) y sus opciones. Ahora puedes <span className="text-neutral-200">editar</span> sin borrar.
        </p>
      </div>

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
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group._id})
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
            <button onClick={cancelEdit} className="rounded-xl border border-neutral-700 px-4 py-2 text-sm">
              Cancelar edicion
            </button>
          )}
        </div>

        {editingId && (
          <div className="text-xs text-neutral-500">
            Editando: <span className="text-neutral-200">{editingId}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">{editingId ? "Editar grupo" : "Nuevo grupo"}</div>

        <div className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">ID grupo</label>
            <input
              value={gid}
              onChange={(e) => setGid(e.target.value)}
              placeholder="toppings"
              disabled={Boolean(editingId)}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-50"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Normaliza: <span className="text-neutral-300">{normalizeId(gid || "...")}</span>
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
            <label className="text-xs text-neutral-400">Max (0 = sin limite)</label>
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

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-2">
          <div className="text-sm font-medium">Agregar opcion</div>

          <div className="grid md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">ID opcion</label>
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
                {ingredients.map((ingredient) => (
                  <option key={ingredient._id} value={ingredient._id}>
                    {ingredient.name} ({ingredient.unit})
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
            + Agregar opcion
          </button>
        </div>

        {options.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-neutral-300">Opciones del grupo (editable):</div>

            <div className="grid md:grid-cols-2 gap-2">
              {options.map((option) => {
                const ingredient = ingredients.find((item) => item._id === option.ingredientId);

                return (
                  <div key={option.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {option.id} <span className="text-xs text-neutral-500">(ID fijo)</span>
                      </div>
                      <button
                        onClick={() => removeOption(option.id)}
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-neutral-400">Nombre</label>
                        <input
                          value={option.name}
                          onChange={(e) => updateOption(option.id, { name: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-neutral-400">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(option.price ?? 0)}
                          onChange={(e) => updateOption(option.id, { price: Number(e.target.value) })}
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-neutral-400">Insumo (opcional)</label>
                        <select
                          value={option.ingredientId ?? ""}
                          onChange={(e) =>
                            updateOption(option.id, { ingredientId: e.target.value || undefined, qty: 0 })
                          }
                          className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                        >
                          <option value="">—</option>
                          {ingredients.map((ingredientItem) => (
                            <option key={ingredientItem._id} value={ingredientItem._id}>
                              {ingredientItem.name} ({ingredientItem.unit})
                            </option>
                          ))}
                        </select>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-neutral-400">Cantidad del insumo</label>
                            <input
                              type="number"
                              step="0.01"
                              value={Number(option.qty ?? 0)}
                              disabled={!option.ingredientId}
                              onChange={(e) => updateOption(option.id, { qty: Number(e.target.value) })}
                              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="text-xs text-neutral-500 mt-6">
                            Unidad: <span className="text-neutral-200">{ingredient?.unit ?? "—"}</span>
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

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="font-medium">Grupos existentes</div>

        {groups.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-2">Aun no hay grupos.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {groups.map((group) => (
              <div key={group._id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {group.name} <span className="text-xs text-neutral-500">({group._id})</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      min: {group.min} · max: {group.max === 0 ? "∞" : group.max} · requerido: {group.required ? "si" : "no"} · opciones:{" "}
                      {group.options?.length ?? 0}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadGroupIntoForm(group._id)}
                      className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteGroup(group._id)}
                      className="rounded-xl border border-red-700 text-red-300 px-3 py-2 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {group.options?.length > 0 && (
                  <div className="mt-2 grid md:grid-cols-2 gap-2">
                    {group.options.map((option) => (
                      <div key={option.id} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                        <div className="text-sm font-medium">
                          {option.name} <span className="text-xs text-neutral-500">({option.id})</span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          +{option.price} {option.ingredientId ? `· Insumo: ${option.ingredientId} (${option.qty ?? 0})` : ""}
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
