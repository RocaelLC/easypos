"use client";

import { useEffect, useMemo, useState } from "react";
import { safeFetchJSON } from "@/lib/safeFetchJSON";

type ModifierOption = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
};

type ModifierGroup = {
  _id: string;
  name: string;
  min: number;
  max: number;
  required: boolean;
  options: ModifierOption[];
};

type Product = {
  _id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  modifierGroupIds: string[];
};

type Selection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

type CartItem = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  qty: number;
  selections: Selection[];
  note?: string;
};

const GROUP_RULES: Record<string, { included: number; extraPrice: number }> = {
  toppings: { included: 1, extraPrice: 8 },
  untables: { included: 1, extraPrice: 8 },
};

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default function CustomizeProductModal({
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
  const [picked, setPicked] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await safeFetchJSON<{ items?: ModifierGroup[] }>("/api/modifier-groups", { cache: "no-store" });
        setAllGroups(Array.isArray(data?.items) ? data.items : []);
      } catch (fetchError: unknown) {
        setError(fetchError instanceof Error ? fetchError.message : "No se pudieron cargar modificadores");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const ids = new Set(product.modifierGroupIds ?? []);
    return allGroups.filter((group) => ids.has(group._id));
  }, [allGroups, product.modifierGroupIds]);

  function toggle(group: ModifierGroup, optionId: string) {
    setError("");
    setPicked((prev) => {
      const current = new Set(prev[group._id] ?? []);
      const has = current.has(optionId);

      if (has) {
        current.delete(optionId);
      } else {
        const max = Number(group.max ?? 0);
        if (max === 1) {
          current.clear();
          current.add(optionId);
        } else {
          if (max !== 0 && current.size >= max) return prev;
          current.add(optionId);
        }
      }

      return { ...prev, [group._id]: current };
    });
  }

  const selections: Selection[] = useMemo(() => {
    const result: Selection[] = [];

    for (const group of groups) {
      const set = picked[group._id] ?? new Set<string>();
      const pickedIds = Array.from(set);

      for (const optionId of pickedIds) {
        const option = group.options?.find((item) => item.id === optionId);
        if (!option) continue;

        result.push({
          groupId: group._id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: Number(option.price ?? 0),
        });
      }

      const rule = GROUP_RULES[group._id];
      if (rule) {
        const extraCount = Math.max(0, pickedIds.length - rule.included);
        if (extraCount > 0) {
          result.push({
            groupId: group._id,
            groupName: group.name,
            optionId: "__extra__",
            optionName: `Extras (${extraCount})`,
            price: extraCount * rule.extraPrice,
          });
        }
      }
    }

    return result;
  }, [groups, picked]);

  const extras = useMemo(() => selections.reduce((sum, item) => sum + item.price, 0), [selections]);
  const unit = product.price + extras;

  function validate() {
    for (const group of groups) {
      const count = picked[group._id]?.size ?? 0;
      const min = Number(group.min ?? 0);
      const max = Number(group.max ?? 0);

      if ((group.required || min > 0) && count < min) {
        return `Selecciona al menos ${min} en "${group.name}".`;
      }
      if (max !== 0 && count > max) {
        return `Maximo ${max} en "${group.name}".`;
      }
    }

    return "";
  }

  function add() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      productId: product._id,
      name: product.name,
      basePrice: product.price,
      qty: 1,
      selections,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl bg-neutral-950 border border-neutral-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{product.name}</div>
            <div className="text-sm text-neutral-400">
              Base: {money(product.price)} · Extras: {money(extras)} · Unidad: <span className="text-neutral-200">{money(unit)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
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
              groups.map((group) => {
                const selected = picked[group._id] ?? new Set<string>();
                const max = Number(group.max ?? 0);
                const isSingle = max === 1;

                return (
                  <div key={group._id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-neutral-400">
                        {group.required ? "Requerido" : "Opcional"} · min {group.min} · max {max === 0 ? "∞" : max} {isSingle ? "· (única)" : ""}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options?.map((option) => {
                        const on = selected.has(option.id);
                        const disabled = !on && max !== 0 && !isSingle && selected.size >= max;

                        return (
                          <button
                            key={option.id}
                            onClick={() => toggle(group, option.id)}
                            disabled={disabled}
                            className={[
                              "rounded-xl border px-3 py-2 text-left text-sm transition",
                              on ? "border-green-500 bg-green-500/10" : "border-neutral-700 bg-neutral-950/30",
                              disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-900",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center">
                                  {option.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={option.imageUrl}
                                      alt={option.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-neutral-400">IMG</span>
                                  )}
                                </div>

                                <div className="font-medium">{option.name}</div>
                              </div>

                              <div className="text-xs text-neutral-300">
                                {option.price ? `+${money(option.price)}` : "+$0"}
                              </div>
                            </div>

                            <div className="mt-1 text-xs text-neutral-500">
                              {on ? "Seleccionado" : "Toca para seleccionar"}
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
          <button onClick={onClose} className="flex-1 rounded-xl border border-neutral-700 py-2 hover:bg-neutral-900">
            Cancelar
          </button>
          <button onClick={add} className="flex-1 rounded-xl bg-green-500 text-black py-2 font-medium">
            Agregar · {money(unit)}
          </button>
        </div>
      </div>
    </div>
  );
}
