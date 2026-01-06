// lib/wallet.ts
export type PaymentMethod = "cash" | "transfer" | "card";
export type WalletState = "available" | "pending";

export type WalletKind =
  | "sale"
  | "expense"
  | "manual"
  | "cash_count"
  | "adjustment"
  | "settlement";

export type WalletMovement = {
  _id?: any;

  amount: number;              // positivo
  direction: "in" | "out";     // in suma, out resta
  method: PaymentMethod;       // cash/transfer/card
  state: WalletState;          // available/pending

  kind: WalletKind;
  category?: string;
  supplier?: string;
  note?: string;

  origin: {
    type: "sale" | "expense" | "manual" | "cash_count" | "settlement";
    refId?: string;
  };

  createdAt: Date;
  createdByUid: string;
  createdByEmail?: string;
};

export function signedAmount(m: Pick<WalletMovement, "amount" | "direction">) {
  return (m.direction === "in" ? 1 : -1) * Number(m.amount || 0);
}

export function normalizeMethod(v: any): PaymentMethod {
  if (v === "cash" || v === "transfer" || v === "card") return v;
  throw new Error("invalid_method");
}

export function normalizeState(v: any): WalletState {
  if (v === "available" || v === "pending") return v;
  throw new Error("invalid_state");
}

export function assertPositiveAmount(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) throw new Error("invalid_amount");
  return x;
}
