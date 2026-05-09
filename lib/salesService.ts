import { queueSale, listQueuedSales, removeQueuedSale } from "./offlineQueue";
import { getAuthClient } from "./firebaseClient";

async function getAuthHeaders() {
  const token = await getAuthClient().currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");
  return { Authorization: `Bearer ${token}` };
}

export async function submitSale(payload: any) {
  const sale = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    payload,
  };

  // Offline o fallo de red → encolar
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueSale(sale);
    return { ok: true, queued: true };
  }

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ ...payload, clientSaleId: sale.id }),
    });
    if (!res.ok) throw new Error("network");
    return { ok: true, queued: false };
  } catch {
    await queueSale(sale);
    return { ok: true, queued: true };
  }
}

export async function syncQueuedSales() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const queued = await listQueuedSales();
  for (const q of queued) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ ...q.payload, clientSaleId: q.id }),
      });
      if (res.ok) await removeQueuedSale(q.id);
      else break;
    } catch {
      break;
    }
  }
}
