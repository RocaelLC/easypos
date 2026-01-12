export type PurchaseItemInput = {
  ingredientId: string;
  qty: number;
  unitCost: number;
};

export type PurchaseMeta = {
  method: "cash" | "transfer" | "card";
  state?: "available" | "pending"; // por si luego lo usas en cartera (hoy lo recibimos)
  category?: string;
  supplier?: string;
};

export async function createPurchase(items: PurchaseItemInput[], meta?: PurchaseMeta) {
  const res = await fetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      method: meta?.method ?? "cash",
      state: meta?.state ?? "available",
      category: meta?.category ?? "Insumos",
      supplier: meta?.supplier ?? "",
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "purchase_failed");
  return data as { ok: true; total: number };
}
