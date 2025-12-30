export type IngredientDoc = {
  _id: string;           // <-- clave: string
  name: string;
  unit: "g" | "ml" | "pz";
  stock: number;
  minStock: number;
  avgCost: number;
};

export type ProductDoc = {
  _id: string; // ejemplo: "fresas-base"
  name: string;
  price: number;
  recipe?: Array<{ ingredientId: string; qty: number }>;
  active?: boolean;
};

export type PurchaseDoc = {
  _id?: any;
  createdAt: Date;
  items: Array<{ ingredientId: string; qty: number; unitCost: number; lineTotal: number }>;
  total: number;
};
