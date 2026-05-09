"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";
import CustomizeProductModal from "@/components/CustomizeProductModal";
import { safeFetchJSON } from "@/lib/safeFetchJSON";
import { getAuthClient } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/useAuth";

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

function normCat(category?: string) {
  return (category || "general").trim().toLowerCase();
}

function catMeta(category: string) {
  const value = normCat(category);

  if (value.includes("fresa")) return { icon: "🍓", ring: "ring-emerald-500/40", tint: "bg-emerald-500/10" };
  if (value.includes("beb")) return { icon: "🥤", ring: "ring-cyan-500/40", tint: "bg-cyan-500/10" };
  if (value.includes("post") || value.includes("dul")) return { icon: "🍰", ring: "ring-fuchsia-500/40", tint: "bg-fuchsia-500/10" };
  if (value.includes("snack")) return { icon: "🍪", ring: "ring-amber-500/40", tint: "bg-amber-500/10" };
  if (value.includes("insumo")) return { icon: "📦", ring: "ring-slate-500/40", tint: "bg-slate-500/10" };

  return { icon: "🧾", ring: "ring-white/10", tint: "bg-white/5" };
}

function productIcon(product: Product) {
  const name = product.name.toLowerCase();
  const category = normCat(product.category);

  if (name.includes("fresa")) return "🍓";
  if (name.includes("nutella")) return "🍫";
  if (name.includes("oreo")) return "🍪";
  if (name.includes("lechera")) return "🥛";
  if (category.includes("beb")) return "🥤";
  return catMeta(product.category).icon;
}

function itemUnitTotal(item: CartItem) {
  const extras = item.selections.reduce((sum, selection) => sum + selection.price, 0);
  return item.basePrice + extras;
}

export default function POSClient() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>("general");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  async function getAuthHeaders() {
    const token = await getAuthClient().currentUser?.getIdToken();
    if (!token) throw new Error("No authenticated user");
    return { Authorization: `Bearer ${token}` };
  }

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const data = await safeFetchJSON<{ items?: Product[] }>("/api/products", {
          cache: "no-store",
          headers,
        });
        const items = Array.isArray(data?.items) ? data.items : [];
        const active = items.filter((product) => product?.active);

        setProducts(active);
        setCategory(active.length > 0 ? active[0].category || "general" : "general");
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setCategory("general");
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const values = new Set(products.map((product) => product.category || "general"));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(
    () => products.filter((product) => (product.category || "general") === category),
    [category, products]
  );

  function onProductClick(product: Product) {
    if (product.modifierGroupIds?.length) {
      setCustomizing(product);
      return;
    }

    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: product._id,
      name: product.name,
      basePrice: product.price,
      qty: 1,
      selections: [],
    };

    setCart((current) => [...current, item]);
  }

  function removeItem(id: string) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function changeQty(id: string, delta: number) {
    setCart((current) =>
      current.map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
    );
  }

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + itemUnitTotal(item) * item.qty, 0),
    [cart]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando sesión...
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-neutral-300">
              <span className="font-semibold text-white">POS</span>
              <span className="mx-2 text-neutral-700">/</span>
              <span className="text-neutral-400">Selecciona productos</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <section className="col-span-12 md:col-span-9">
              <div className="sticky top-0 z-10 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-3 pt-2 bg-neutral-950/80 backdrop-blur">
                {categories.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map((value) => {
                      const isOn = value === category;
                      const meta = catMeta(value);

                      return (
                        <button
                          key={value}
                          onClick={() => setCategory(value)}
                          className={[
                            "shrink-0 rounded-full px-3 py-2 text-sm",
                            "border transition",
                            isOn
                              ? `border-white/15 ${meta.tint} ring-2 ${meta.ring}`
                              : "border-white/10 bg-white/5 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="mr-2">{meta.icon}</span>
                          <span className="capitalize">{value}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-400">No hay productos activos.</div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((product) => {
                  const hasMods = Boolean(product.modifierGroupIds?.length);
                  const meta = catMeta(product.category);
                  const icon = productIcon(product);

                  return (
                    <button
                      key={product._id}
                      onClick={() => onProductClick(product)}
                      className={[
                        "group relative overflow-hidden rounded-2xl text-left",
                        "border border-white/10 bg-white/5",
                        "transition active:scale-[0.99] hover:bg-white/10",
                        "aspect-square p-3",
                        "focus:outline-none focus:ring-2 focus:ring-white/20",
                      ].join(" ")}
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                      <div className="flex items-center justify-between">
                        <div className={["h-11 w-11 rounded-2xl grid place-items-center", meta.tint, "border border-white/10"].join(" ")}>
                          <span className="text-2xl">{icon}</span>
                        </div>

                        {hasMods ? (
                          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-neutral-200">
                            <span>⚙️</span>
                            <span className="hidden sm:inline">Personalizable</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3">
                        <div className="font-semibold leading-tight line-clamp-2">{product.name}</div>
                        <div className="mt-1 text-sm text-neutral-300">{money(product.price)}</div>
                      </div>

                      <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-neutral-400 opacity-0 group-hover:opacity-100 transition">
                        Tocar para agregar
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="col-span-12 md:col-span-3 md:border-l md:border-white/10 md:pl-3">
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
                    <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.selections.length > 0 && (
                            <div className="mt-1 text-xs text-neutral-400 space-y-1">
                              {item.selections.map((selection) => (
                                <div key={`${item.id}-${selection.groupId}-${selection.optionId}`}>
                                  • {selection.groupName}: {selection.optionName} {selection.price ? `(+${money(selection.price)})` : ""}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.note && <div className="mt-1 text-xs text-neutral-500">Nota: {item.note}</div>}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-sm rounded-xl border border-white/10 px-2 py-1 hover:bg-white/10"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            className="rounded-xl border border-white/10 px-3 py-1 hover:bg-white/10"
                          >
                            -
                          </button>
                          <div className="min-w-8 text-center">{item.qty}</div>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            className="rounded-xl border border-white/10 px-3 py-1 hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-sm text-neutral-300">
                          {money(unit)} c/u · <span className="font-semibold text-white">{money(unit * item.qty)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 border-t border-white/10 pt-3">
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
        </div>
      </div>

      {customizing && (
        <CustomizeProductModal
          product={customizing}
          onClose={() => setCustomizing(null)}
          onAdd={(item) => setCart((current) => [...current, item])}
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
