export type PurchaseItemInput = {
  ingredientId: string;
  qty: number;
  unitCost: number;
};

export async function createPurchase(items: PurchaseItemInput[]) {
  const res = await fetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "purchase_failed");
  return data as { ok: true; total: number };
}
