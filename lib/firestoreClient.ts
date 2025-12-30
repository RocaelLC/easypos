import { getFirestore } from "firebase/firestore";
import { getFirebaseAppClient } from "@/lib/firebaseClient";

export function getDBClient() {
  const app = getFirebaseAppClient();
  return getFirestore(app);
}
