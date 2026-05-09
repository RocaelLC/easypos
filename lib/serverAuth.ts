import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    throw new Error("missing_auth_token");
  }

  const token = match[1];
  const decoded = await getAdminAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
  };
}

export function authErrorResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
