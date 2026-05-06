import { MongoClient } from "mongodb";
import { applyMongoDnsFix } from "@/lib/mongoDnsFix";

applyMongoDnsFix();

let clientPromise: Promise<MongoClient> | null = null;

function getDatabaseNameFromUri(connectionString: string) {
  const match = connectionString.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const rawName = match?.[1]?.trim();
  return rawName ? decodeURIComponent(rawName) : "";
}

function getMongoClientPromise() {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en variables de entorno");
  }

  const client = new MongoClient(uri);
  clientPromise = client.connect();
  return clientPromise;
}

export async function getDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en variables de entorno");
  }

  const dbName = process.env.MONGODB_DB || getDatabaseNameFromUri(uri);
  if (!dbName) {
    throw new Error("Falta MONGODB_DB en variables de entorno o en la URI de MongoDB");
  }

  const client = await getMongoClientPromise();
  return client.db(dbName);
}
