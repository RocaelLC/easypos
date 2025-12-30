export type ModifierOption = {
  id: string;
  name: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  min: number; // mínimo de selecciones
  max: number; // máximo de selecciones
  options: ModifierOption[];
};

export type Product = {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  modifiers?: ModifierGroup[];
};

export type CartModifierSelection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type CartItem = {
  id: string; // uuid
  productId: string;
  name: string;
  basePrice: number;
  qty: number;
  note?: string;
  selections: CartModifierSelection[];
};
