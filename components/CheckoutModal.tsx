"use client";
import { useState } from "react";
import { submitSale } from "@/lib/salesService";

export default function CheckoutModal({
  total,
  cart,
  onClose,
  onDone,
}: {
  total: number;
  cart: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "transfer" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const money = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  async function pay() {
  setLoading(true);

  const items = cart.map((i) => ({
  productId: i.productId ?? i.id,
  qty: i.qty ?? i.quantity ?? 1,
  price: Number(i.price ?? i.unitPrice ?? i.basePrice ?? 0),
  name: i.name,
}));

  await submitSale({
    items,
    total,
    paymentMethod: method,
    createdAt: new Date().toISOString(),
  });

  setLoading(false);
  onDone();
}
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl bg-neutral-950 border border-neutral-800 p-4">
        <div className="text-lg font-semibold">Cobro</div>
        <div className="text-sm text-neutral-400 mt-1">Total: {money(total)}</div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["cash","transfer","card"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                method===m ? "border-green-500 bg-green-500/10" : "border-neutral-700"
              }`}
            >
              {m === "cash" ? "Efectivo" : m === "transfer" ? "Transferencia" : "Tarjeta"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-700 py-2"
          >
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={pay}
            className="flex-1 rounded-xl bg-green-500 text-black py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
