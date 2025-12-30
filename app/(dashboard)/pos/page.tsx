export const dynamic = "force-dynamic";

"use client";

import { useEffect, useMemo, useState } from "react";
import CustomizeProductModal from "@/components/CustomizeProductModal";
import CheckoutModal from "@/components/CheckoutModal";

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

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function itemUnitTotal(item: CartItem) {
  const extras = item.selections.reduce((s, x) => s + x.price, 0);
  return item.basePrice + extras;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const categories = useMemo(() => {
    const set = new Set(products.filter(p => p.active).map((p) => p.category || "general"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [category, setCategory] = useState<string>("general");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // cargar productos desde API
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const items: Product[] = (data.items ?? []).filter((p: Product) => p.active);
      setProducts(items);

      // setea categoría inicial
      if (items.length > 0) {
        const firstCat = (items[0].category || "general");
        setCategory(firstCat);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => (p.category || "general") === category),
    [products, category]
  );

  function onProductClick(p: Product) {
    if (p.modifierGroupIds && p.modifierGroupIds.length > 0) setCustomizing(p);
    else {
      const item: CartItem = {
        id: crypto.randomUUID(),
        productId: p._id,
        name: p.name,
        basePrice: p.price,
        qty: 1,
        selections: [],
      };
      setCart((c) => [...c, item]);
    }
  }

  function removeItem(id: string) {
    setCart((c) => c.filter((x) => x.id !== id));
  }

  function changeQty(id: string, delta: number) {
    setCart((c) =>
      c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
    );
  }

  const total = useMemo(
    () => cart.reduce((s, it) => s + itemUnitTotal(it) * it.qty, 0),
    [cart]
  );

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {/* Categorías */}
        <aside className="col-span-12 md:col-span-2 space-y-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`w-full rounded-xl px-3 py-2 text-sm ${
                c === category ? "bg-green-500 text-black" : "bg-neutral-800 text-white"
              }`}
            >
              {c}
            </button>
          ))}
          {categories.length === 0 && (
            <div className="text-sm text-neutral-400">No hay productos activos.</div>
          )}
        </aside>

        {/* Productos */}
        <section className="col-span-12 md:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <button
              key={p._id}
              onClick={() => onProductClick(p)}
              className="rounded-xl border border-neutral-700 p-4 hover:bg-neutral-900 text-left"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-neutral-400 mt-1">{money(p.price)}</div>
              {p.modifierGroupIds?.length ? (
                <div className="mt-2 inline-flex text-xs rounded-full border border-neutral-700 px-2 py-1 text-neutral-300">
                  Personalizable
                </div>
              ) : null}
            </button>
          ))}
        </section>

        {/* Carrito */}
        <aside className="col-span-12 md:col-span-3 border-l border-neutral-800 md:pl-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Carrito</h2>
            {cart.length > 0 ? (
              <button className="text-sm underline text-neutral-300" onClick={() => setCart([])}>
                Vaciar
              </button>
            ) : null}
          </div>

          {cart.length === 0 && <p className="text-sm text-neutral-400 mt-2">Vacío</p>}

          <ul className="mt-3 space-y-3">
            {cart.map((item) => {
              const unit = itemUnitTotal(item);
              return (
                <li key={item.id} className="rounded-2xl border border-neutral-800 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.selections.length > 0 && (
                        <div className="mt-1 text-xs text-neutral-400 space-y-1">
                          {item.selections.map((s) => (
                            <div key={`${item.id}-${s.groupId}-${s.optionId}`}>
                              • {s.groupName}: {s.optionName} {s.price ? `(+${money(s.price)})` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.note && <div className="mt-1 text-xs text-neutral-500">Nota: {item.note}</div>}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm rounded-xl border border-neutral-700 px-2 py-1 hover:bg-neutral-900"
                    >
                      X
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        className="rounded-xl border border-neutral-700 px-3 py-1 hover:bg-neutral-900"
                      >
                        -
                      </button>
                      <div className="min-w-8 text-center">{item.qty}</div>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        className="rounded-xl border border-neutral-700 px-3 py-1 hover:bg-neutral-900"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-neutral-300">
                      {money(unit)} c/u ·{" "}
                      <span className="font-semibold text-white">{money(unit * item.qty)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-neutral-800 pt-3">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="mt-3 w-full rounded-xl bg-green-500 text-black py-2 font-medium disabled:opacity-50"
            >
              Cobrar
            </button>
          </div>
        </aside>
      </div>

      {customizing && (
        <CustomizeProductModal
          product={customizing}
          onClose={() => setCustomizing(null)}
          onAdd={(item) => setCart((c) => [...c, item])}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          total={total}
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onDone={() => {
            setCheckoutOpen(false);
            setCart([]);
          }}
        />
      )}
    </>
  );
}
