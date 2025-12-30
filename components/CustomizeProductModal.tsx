"use client";

import { useMemo, useState } from "react";
import type { CartItem, CartModifierSelection, ModifierGroup, Product } from "@/lib/posTypes";

type Props = {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
};

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default function CustomizeProductModal({ product, onClose, onAdd }: Props) {
  const groups = product.modifiers ?? [];
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, Set<string>>>({});
  const [error, setError] = useState<string | null>(null);

  function toggleOption(group: ModifierGroup, optionId: string) {
    setError(null);
    setSelectedByGroup((prev) => {
      const next = { ...prev };
      const current = new Set(next[group.id] ?? []);

      // radio (max=1)
      if (group.max === 1) {
        current.clear();
        current.add(optionId);
      } else {
        if (current.has(optionId)) current.delete(optionId);
        else {
          // respeta max
          if (current.size >= group.max) return prev;
          current.add(optionId);
        }
      }

      next[group.id] = current;
      return next;
    });
  }

  function buildSelections(): CartModifierSelection[] {
    const selections: CartModifierSelection[] = [];
    for (const g of groups) {
      const set = selectedByGroup[g.id] ?? new Set<string>();
      for (const optId of set) {
        const opt = g.options.find((o) => o.id === optId);
        if (!opt) continue;
        selections.push({
          groupId: g.id,
          groupName: g.name,
          optionId: opt.id,
          optionName: opt.name,
          price: opt.price,
        });
      }
    }
    return selections;
  }

  function validate(): string | null {
    for (const g of groups) {
      const count = (selectedByGroup[g.id] ?? new Set()).size;
      if (g.required && count < g.min) return `Selecciona ${g.min} opción(es) en "${g.name}".`;
      if (count > g.max) return `Máximo ${g.max} opción(es) en "${g.name}".`;
      if (count < g.min) return `Mínimo ${g.min} opción(es) en "${g.name}".`;
    }
    return null;
  }

  const selections = useMemo(buildSelections, [selectedByGroup, product.id]);
  const extrasTotal = useMemo(() => selections.reduce((s, x) => s + x.price, 0), [selections]);
  const unitTotal = product.basePrice + extrasTotal;
  const total = unitTotal * qty;

  function handleAdd() {
    const msg = validate();
    if (msg) return setError(msg);

    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      basePrice: product.basePrice,
      qty,
      note: note.trim() || undefined,
      selections,
    };

    onAdd(item);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:max-w-xl rounded-t-2xl md:rounded-2xl bg-neutral-950 border border-neutral-800 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{product.name}</div>
            <div className="text-sm text-neutral-400">
              Base: {money(product.basePrice)} · Unit: {money(unitTotal)}
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900">
            Cerrar
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto pr-1">
          {groups.length === 0 ? (
            <div className="text-sm text-neutral-400">Este producto no tiene modificadores.</div>
          ) : (
            groups.map((g) => {
              const set = selectedByGroup[g.id] ?? new Set<string>();
              const isRadio = g.max === 1;
              return (
                <div key={g.id} className="rounded-2xl border border-neutral-800 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-neutral-400">
                      {g.required ? "Obligatorio" : "Opcional"} · {isRadio ? "Elige 1" : `0..${g.max}`}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {g.options.map((o) => {
                      const checked = set.has(o.id);
                      return (
                        <button
                          key={o.id}
                          onClick={() => toggleOption(g, o.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm ${
                            checked ? "border-green-500 bg-green-500/10" : "border-neutral-700 hover:bg-neutral-900"
                          }`}
                        >
                          <span>{o.name}</span>
                          <span className="text-neutral-300">{o.price === 0 ? "—" : `+${money(o.price)}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="font-medium">Nota</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: sin hielo, poco azúcar…"
              className="mt-2 w-full rounded-xl bg-neutral-900 border border-neutral-700 p-3 text-sm"
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Cantidad</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="rounded-xl border border-neutral-700 px-3 py-2 hover:bg-neutral-900"
                >
                  -
                </button>
                <div className="min-w-10 text-center">{qty}</div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="rounded-xl border border-neutral-700 px-3 py-2 hover:bg-neutral-900"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            Extras: {money(extrasTotal)} · Total: <span className="text-white font-semibold">{money(total)}</span>
          </div>
          <button onClick={handleAdd} className="rounded-xl bg-green-500 text-black px-4 py-2 font-medium">
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
