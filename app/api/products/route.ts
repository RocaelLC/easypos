import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getUserFromRequest, authErrorResponse } from "@/lib/serverAuth";

type ProductRecipeItemDoc = {
  ingredientId: string;
  qty: number;
};

type ProductRecipeInput = {
  ingredientId?: unknown;
  qty?: unknown;
};

type ProductDoc = {
  _id: string;
  productId: string;
  ownerUid: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  modifierGroupIds: string[];
  recipe: ProductRecipeItemDoc[];
};

function buildInternalId(ownerUid: string, productId: string) {
  return `${ownerUid}:${productId}`;
}

function mapProductForClient(product: ProductDoc) {
  return {
    ...product,
    _id: product.productId,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const db = await getDB();
    const items = await db
      .collection<ProductDoc>("products")
      .find({ ownerUid: user.uid })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ ok: true, items: items.map(mapProductForClient) });
  } catch (error) {
    console.error("GET /api/products error:", error);
    if ((error as Error)?.message === "missing_auth_token") return authErrorResponse();
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar los productos",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const {
      id,
      name,
      price = 0,
      category = "general",
      active = true,
      modifierGroupIds = [],
      recipe = [],
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const safeId = String(id).trim();

    const safeGroups: string[] = Array.isArray(modifierGroupIds)
      ? modifierGroupIds.map((value: unknown) => String(value).trim()).filter(Boolean)
      : [];

    const safeRecipe: ProductRecipeItemDoc[] = Array.isArray(recipe)
      ? recipe
          .map((item: ProductRecipeInput) => ({
            ingredientId: String(item.ingredientId ?? "").trim(),
            qty: Number(item.qty ?? 0),
          }))
          .filter((item) => item.ingredientId && Number.isFinite(item.qty) && item.qty > 0)
      : [];

    const doc: ProductDoc = {
      _id: buildInternalId(user.uid, safeId),
      productId: safeId,
      ownerUid: user.uid,
      name: String(name).trim(),
      price: Number(price ?? 0),
      category: String(category ?? "general").trim() || "general",
      active: Boolean(active),
      modifierGroupIds: safeGroups,
      recipe: safeRecipe,
    };

    const db = await getDB();
    await db.collection<ProductDoc>("products").updateOne(
      { _id: doc._id },
      { $set: doc },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[products] POST error:", error);
    if ((error as Error)?.message === "missing_auth_token") return authErrorResponse();
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo guardar el producto",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = await getDB();
    await db.collection<ProductDoc>("products").deleteOne({ _id: buildInternalId(user.uid, String(id).trim()) });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    if ((error as Error)?.message === "missing_auth_token") return authErrorResponse();
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo eliminar el producto",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
