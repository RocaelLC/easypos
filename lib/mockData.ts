import type { Product } from "./posTypes";

export const categories = ["Cafés", "Frappes", "Postres", "Fresas con crema"];

export const products: Product[] = [
  {
    id: "fresas-base",
    name: "Fresas con crema",
    basePrice: 50,
    category: "Fresas con crema",
    modifiers: [
      {
        id: "tamanio",
        name: "Tamaño",
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: "ch", name: "Chico", price: 0 },
          { id: "med", name: "Mediano", price: 15 },
          { id: "gr", name: "Grande", price: 25 },
        ],
      },
      {
        id: "toppings",
        name: "Toppings",
        required: false,
        min: 0,
        max: 3,
        options: [
          { id: "oreo", name: "Oreo", price: 10 },
          { id: "choco", name: "Chocolate", price: 10 },
          { id: "nuez", name: "Nuez", price: 15 },
          { id: "chantilly", name: "Chantilly", price: 10 },
        ],
      },
    ],
  },
  {
    id: "frappe-oreo",
    name: "Frappé Oreo",
    basePrice: 65,
    category: "Frappes",
    modifiers: [
      {
        id: "size",
        name: "Tamaño",
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: "12", name: "12oz", price: 0 },
          { id: "16", name: "16oz", price: 15 },
          { id: "20", name: "20oz", price: 25 },
        ],
      },
      {
        id: "milk",
        name: "Leche",
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: "entera", name: "Entera", price: 0 },
          { id: "des", name: "Deslactosada", price: 5 },
          { id: "alm", name: "Almendra", price: 10 },
        ],
      },
      {
        id: "extras",
        name: "Extras",
        required: false,
        min: 0,
        max: 2,
        options: [
          { id: "espresso", name: "Extra espresso", price: 12 },
          { id: "crema", name: "Extra crema", price: 10 },
        ],
      },
    ],
  },
];
