"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { getStorageClient } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Ingredient = {
  _id: string;
  name: string;
  unit: "g" | "ml" | "pz";
  stock: number;
  minStock: number;
  avgCost: number;
};

type ModifierOption = {
  id: string;               // "oreo"
  name: string;             // "Oreo"
  price: number;            // +10
  imageUrl?: string;        // ✅ NUEVO
  ingredientId?: string;    // "oreo"
  qty?: number;             // 20 (g/ml/pz)
};

type ModifierGroup = {
  _id: string;              // "toppings"
  name: string;             // "Toppings"
  min: number;              // 0
  max: number;              // 3 (0 = sin límite)
  required: boolean;
  options: ModifierOption[];
};

export default function ModificadoresPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Form grupo
  const [gid, setGid] = useState("");
  const [gname, setGname] = useState("");
  const [gmin, setGmin] = useState(0);
  const [gmax, setGmax] = useState(0);
  const [grequired, setGrequired] = useState(false);

  // Opciones
  const [optId, setOptId] = useState("");
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState<number>(0);
  const [optIng, setOptIng] = useState<string>("");
  const [optQty, setOptQty] = useState<number>(0);
  const [options, setOptions] = useState<ModifierOption[]>([]);

  // Imagen opción
  const [optFile, setOptFile] = useState<File | null>(null);
  const [optPreview, setOptPreview] = useState<string>("");
  const [uploadingOpt, setUploadingOpt] = useState(false);

  const normalizeId = (v: string) =>
    v.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  useEffect(() => {
    if (!optFile) { setOptPreview(""); return; }
    const url = URL.createObjectURL(optFile);
    setOptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [optFile]);

  async function loadAll() {
    const [g, ing] = await Promise.all([fetch("/api/modifier-groups"), fetch("/api/ingredients")]);
    const gd = await g.json();
    const id = await ing.json();
    setGroups(gd.items ?? []);
    setIngredients(id.items ?? []);
  }

  useEffect(() => { loadAll(); }, []);

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => i._id === optIng),
    [ingredients, optIng]
  );

 async function uploadModifierOptionImage(file: File, groupId: string, optionId: string) {
  const safeGroup = normalizeId(groupId || "grupo");
  const safeOpt = normalizeId(optionId || "opcion");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `modifier-options/${safeGroup}/${safeOpt}.${ext}`;

  const storage = getStorageClient(); // ✅ instancia real
  const r = ref(storage, path);

  await uploadBytes(r, file, { contentType: file.type || "image/jpeg" });
  return await getDownloadURL(r);
}

  async function addOption() {
    setMsg("");
    const gidNorm = normalizeId(gid);
    if (!gidNorm) return setMsg("❌ Primero define el ID del grupo (ej: toppings).");

    const oid = normalizeId(optId);
    if (!oid) return setMsg("❌ ID de opción obligatorio (ej: oreo).");
    if (!optName.trim()) return setMsg("❌ Nombre de opción obligatorio.");
    if (options.some(o => o.id === oid)) return setMsg("❌ Ese ID de opción ya existe en el grupo.");
    if (!optFile) return setMsg("❌ Sube una imagen para esta opción.");

    // Validación básica de archivo
    if (!optFile.type.startsWith("image/")) return setMsg("❌ El archivo debe ser una imagen.");
    const maxMB = 3;
    if (optFile.size > maxMB * 1024 * 1024) return setMsg(`❌ La imagen debe pesar menos de ${maxMB}MB.`);

    setUploadingOpt(true);
    try {
      const imageUrl = await uploadModifierOptionImage(optFile, gidNorm, oid);

      const opt: ModifierOption = {
        id: oid,
        name: optName.trim(),
        price: Number(optPrice ?? 0),
        imageUrl,
        ingredientId: optIng ? String(optIng) : undefined,
        qty: optIng ? Number(optQty ?? 0) : undefined,
      };

      setOptions(prev => [...prev, opt]);

      // reset
      setOptId("");
      setOptName("");
      setOptPrice(0);
      setOptIng("");
      setOptQty(0);
      setOptFile(null);

      setMsg("✅ Opción agregada con imagen.");
    } catch (e: any) {
      setMsg("❌ No se pudo subir imagen: " + (e?.message ?? "error"));
    } finally {
      setUploadingOpt(false);
    }
  }

  function removeOption(id: string) {
    setOptions(prev => prev.filter(o => o.id !== id));
  }

  async function saveGroup() {
    setMsg("");
    const id = normalizeId(gid);
    if (!id) return setMsg("❌ ID de grupo obligatorio (ej: toppings).");
    if (!gname.trim()) return setMsg("❌ Nombre de grupo obligatorio.");
    if (gmin < 0) return setMsg("❌ min inválido.");
    if (gmax < 0) return setMsg("❌ max inválido.");
    if (gmax !== 0 && gmax < gmin) return setMsg("❌ max no puede ser menor que min.");

    // ✅ asegurar que todas las opciones tengan imagen
    const missingImg = options.find(o => !o.imageUrl);
    if (missingImg) return setMsg(`❌ La opción "${missingImg.name}" no tiene imagen.`);

    setLoading(true);
    try {
      const res = await fetch("/api/modifier-groups", {
        method: "POST",
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

      setMsg("✅ Grupo guardado.");
      setGid(""); setGname(""); setGmin(0); setGmax(0); setGrequired(false); setOptions([]);
      await loadAll();
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
    } catch (e: any) {
      setMsg("❌ Error: " + (e?.message ?? "No se pudo eliminar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Modificadores</h1>
        <p className="text-sm text-neutral-400">
          Crea grupos (Tamaño, Toppings, Leche...) y sus opciones. Ahora cada opción puede tener imagen.
        </p>
      </div>

      {/* Crear grupo */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
        <div className="font-medium">Nuevo grupo</div>

        <div className="grid md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">ID grupo</label>
            <input
              value={gid}
              onChange={(e)=>setGid(e.target.value)}
              placeholder="toppings"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
            <div className="text-xs text-neutral-500 mt-1">
              Normaliza: <span className="text-neutral-300">{normalizeId(gid || "…")}</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-neutral-400">Nombre</label>
            <input
              value={gname}
              onChange={(e)=>setGname(e.target.value)}
              placeholder="Toppings"
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Min</label>
            <input
              type="number"
              value={gmin}
              onChange={(e)=>setGmin(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Max (0 = sin límite)</label>
            <input
              type="number"
              value={gmax}
              onChange={(e)=>setGmax(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={grequired} onChange={(e)=>setGrequired(e.target.checked)} />
          Requerido
        </label>

        {/* Opción */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-2">
          <div className="text-sm font-medium">Agregar opción (con imagen)</div>

          <div className="grid md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">ID opción</label>
              <input
                value={optId}
                onChange={(e)=>setOptId(e.target.value)}
                placeholder="oreo"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">Nombre</label>
              <input
                value={optName}
                onChange={(e)=>setOptName(e.target.value)}
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
                onChange={(e)=>setOptPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400">Insumo (opcional)</label>
              <select
                value={optIng}
                onChange={(e)=>setOptIng(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              >
                <option value="">—</option>
                {ingredients.map(i => (
                  <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400">Cantidad del insumo</label>
              <input
                type="number"
                step="0.01"
                value={optQty}
                onChange={(e)=>setOptQty(Number(e.target.value))}
                disabled={!optIng}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 disabled:opacity-50"
              />
              {optIng && selectedIngredient && (
                <div className="text-xs text-neutral-500 mt-1">
                  Unidad: <span className="text-neutral-300">{selectedIngredient.unit}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-neutral-400">Imagen (obligatoria)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setOptFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
              />
              {optPreview && (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optPreview}
                    alt="preview"
                    className="h-12 w-12 rounded-xl object-cover border border-neutral-800"
                  />
                  <div className="text-xs text-neutral-400">Preview</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={addOption}
            disabled={uploadingOpt}
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm disabled:opacity-50"
          >
            {uploadingOpt ? "Subiendo..." : "+ Agregar opción"}
          </button>

          {options.length > 0 && (
            <div className="mt-2 space-y-2">
              {options.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                  <div className="flex items-center gap-3">
                    {o.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.imageUrl} alt={o.name} className="h-10 w-10 rounded-xl object-cover border border-neutral-800" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 grid place-items-center text-xs text-neutral-500">
                        IMG
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">{o.name} <span className="text-xs text-neutral-500">({o.id})</span></div>
                      <div className="text-xs text-neutral-400">
                        +{o.price} {o.ingredientId ? `· Insumo: ${o.ingredientId} (${o.qty ?? 0})` : ""}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeOption(o.id)} className="text-sm text-red-300 hover:text-red-200">
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={loading}
            onClick={saveGroup}
            className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar grupo"}
          </button>

          {msg && (
            <div className={`text-sm ${msg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
              {msg}
            </div>
          )}
        </div>
      </div>

      {/* Lista grupos */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="font-medium">Grupos existentes</div>

        {groups.length === 0 ? (
          <div className="text-sm text-neutral-400 mt-2">Aún no hay grupos.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {groups.map(g => (
              <div key={g._id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {g.name} <span className="text-xs text-neutral-500">({g._id})</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      min: {g.min} · max: {g.max === 0 ? "∞" : g.max} · requerido: {g.required ? "sí" : "no"} · opciones: {g.options?.length ?? 0}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGroup(g._id)}
                    className="rounded-xl border border-red-700 text-red-300 px-3 py-2 text-sm"
                  >
                    Eliminar
                  </button>
                </div>

                {g.options?.length > 0 && (
                  <div className="mt-2 grid md:grid-cols-2 gap-2">
                    {g.options.map(o => (
                      <div key={o.id} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                        <div className="flex items-center gap-3">
                          {o.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={o.imageUrl} alt={o.name} className="h-10 w-10 rounded-xl object-cover border border-neutral-800" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 grid place-items-center text-xs text-neutral-500">
                              IMG
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {o.name} <span className="text-xs text-neutral-500">({o.id})</span>
                            </div>
                            <div className="text-xs text-neutral-400">
                              +{o.price} {o.ingredientId ? `· Insumo: ${o.ingredientId} (${o.qty ?? 0})` : ""}
                            </div>
                          </div>
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
