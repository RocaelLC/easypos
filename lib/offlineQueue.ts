import { openDB } from "idb";

const DB = "easypos-db";
const STORE = "salesQueue";

export type QueuedSale = {
  id: string;              // clientSaleId (uuid)
  createdAt: string;
  payload: any;            // venta completa
};

async function getDB() {
  return openDB(DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function queueSale(sale: QueuedSale) {
  const db = await getDB();
  await db.put(STORE, sale);
}

export async function listQueuedSales(): Promise<QueuedSale[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function removeQueuedSale(id: string) {
  const db = await getDB();
  await db.delete(STORE, id);
}
