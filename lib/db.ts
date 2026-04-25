import { MongoClient } from "mongodb";
import { applyMongoDnsFix } from "@/lib/mongoDnsFix";

applyMongoDnsFix();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Falta MONGODB_URI en variables de entorno");
}

const dbName = process.env.MONGODB_DB || getDatabaseNameFromUri(uri);
if (!dbName) {
  throw new Error("Falta MONGODB_DB en variables de entorno o en la URI de MongoDB");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export async function getDB() {
  const client = await clientPromise;
  return client.db(dbName);
}

function getDatabaseNameFromUri(connectionString: string) {
  const match = connectionString.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const rawName = match?.[1]?.trim();
  return rawName ? decodeURIComponent(rawName) : "";
}
