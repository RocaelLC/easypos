import { MongoClient } from "mongodb";
import { applyMongoDnsFix } from "@/lib/mongoDnsFix";
applyMongoDnsFix();

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("Missing MONGODB_URI in .env.local");

let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDB() {
  const client = await clientPromise;
  return client.db(); // usa la DB de la URI (easypos)
}
