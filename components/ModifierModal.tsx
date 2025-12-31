"use client";

import { useEffect, useMemo, useState } from "react";

type ModifierOption = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string; // ✅
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

type Product = {
  _id: string;
  name: string;
  price: number;
  modifierGroupIds: string[];
};

export type CartModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  name: string;
  price: number;
};

export type CartItem = {
  id: string; // lineId
  productId: string;
  name: string;
  qty: number;
  basePrice: number;
  price: number; // base + extras por unidad
  modifiers: CartModifier[];
};

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default function ModifierModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [allGroups, setAllGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // selections[groupId] = Set<optionId>
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/modifier-groups");
        const data = await res.json();
        setAllGroups(data.items ?? []);
      } catch (e: any) {
        setError(e?.message ?? "No se pudieron cargar modificadores");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const ids = new Set(product.modifierGroupIds ?? []);
    return allGroups.filter((g) => ids.has(g._id));
  }, [allGroups, product.modifierGroupIds]);

  function toggle(group: ModifierGroup, optionId: string) {
    setSelections((prev) => {
      const current = new Set(prev[group._id] ?? []);
      const has = current.has(optionId);

      if (has) {
        current.delete(optionId);
      } else {
        // si max es 1 o es selección única, reemplaza
        const max = group.max ?? 0;
        const isSingle = max === 1;

        if (isSingle) {
          current.clear();
          current.add(optionId);
        } else {
          // si hay límite y ya alcanzó, no dejar agregar
          if (max !== 0 && current.size >= max) return prev;
          current.add(optionId);
        }
      }

      return { ...prev, [group._id]: current };
    });
  }

  const pickedModifiers: CartModifier[] = useMemo(() => {
    const out: CartModifier[] = [];
    for (const g of groups) {
      const set = selections[g._id] ?? new Set<string>();
      for (const oid of set) {
        const opt = g.options?.find((o) => o.id === oid);
        if (!opt) continue;
        out.push({
          groupId: g._id,
          groupName: g.name,
          optionId: opt.id,
          name: opt.name,
          price: Number(opt.price ?? 0),
        });
      }
    }
    return out;
  }, [groups, selections]);

  const extras = useMemo(() => pickedModifiers.reduce((acc, m) => acc + (m.price ?? 0), 0), [pickedModifiers]);
  const unitPrice = product.price + extras;

  function validate() {
    for (const g of groups) {
      const count = (selections[g._id]?.size ?? 0);
      const min = Number(g.min ?? 0);
      const max = Number(g.max ?? 0);

      // required o min > 0
      if ((g.required || min > 0) && count < min) {
        return `Selecciona al menos ${min} en "${g.name}".`;
      }
      if (max !== 0 && count > max) {
        return `Máximo ${max} en "${g.name}".`;
      }
    }
    return "";
  }

  function addToCart() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: product._id,
      name: product.name,
      qty: 1,
      basePrice: product.price,
      price: unitPrice,
      modifiers: pickedModifiers,
    };

    onAdd(item);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl bg-neutral-950 border border-neutral-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{product.name}</div>
            <div className="text-sm text-neutral-400">
              Base: {money(product.price)} · Extras: {money(extras)} · Unidad: <span className="text-neutral-200">{money(unitPrice)}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-700 px-3 py-2 text-sm">
            Cerrar
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-neutral-400">Cargando modificadores...</div>
        ) : (
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto pr-1">
            {groups.length === 0 ? (
              <div className="text-sm text-neutral-400">
                Este producto no tiene modificadores. Puedes agregarlo directo.
              </div>
            ) : (
              groups.map((g) => {
                const selected = selections[g._id] ?? new Set<string>();
                const max = Number(g.max ?? 0);
                const isSingle = max === 1;

                return (
                  <div key={g._id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-neutral-400">
                        {g.required ? "Requerido" : "Opcional"} · min {g.min} · max {max === 0 ? "∞" : max}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {g.options?.map((o) => {
                        const on = selected.has(o.id);
                        const disabled = !on && max !== 0 && !isSingle && selected.size >= max;

                        return (
                          <button
                            key={o.id}
                            onClick={() => toggle(g, o.id)}
                            disabled={disabled}
                            className={[
                              "rounded-xl border px-3 py-2 text-left text-sm",
                              on ? "border-green-500 bg-green-500/10" : "border-neutral-700",
                              disabled ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium">{o.name}</div>
                              <div className="text-xs text-neutral-300">
                                {o.price ? `+${money(o.price)}` : "+$0"}
                              </div>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              {o.ingredientId ? `Insumo: ${o.ingredientId} (${o.qty ?? 0})` : "—"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-neutral-700 py-2">
            Cancelar
          </button>
          <button
            onClick={addToCart}
            className="flex-1 rounded-xl bg-green-500 text-black py-2 font-medium"
          >
            Agregar · {money(unitPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
