import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import type { Document } from "mongodb";

type ModifierGroupDoc = {
  _id: string;
  name: string;
  min: number;
  max: number;
  required: boolean;
  options: ModifierGroupOptionDoc[];
};

type ModifierGroupOptionDoc = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  ingredientId?: string;
  qty?: number;
};

type ModifierGroupInput = {
  id?: unknown;
  name?: unknown;
  min?: unknown;
  max?: unknown;
  required?: unknown;
  options?: unknown;
};

type ModifierGroupOptionInput = {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  imageUrl?: unknown;
  ingredientId?: unknown;
  qty?: unknown;
};

export async function GET() {
  try {
    const db = await getDB();
    const items = await db
      .collection<Document>("modifier_groups")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("GET /api/modifier-groups error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar los grupos de modificadores",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ModifierGroupInput;
    const { id, name, min = 0, max = 0, required = false, options = [] } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 });
    }

    const safeId = String(id).trim();
    const safeOptions: ModifierGroupOptionDoc[] = Array.isArray(options)
      ? options
          .map((option) => {
            const value = option as ModifierGroupOptionInput;
            return {
              id: String(value.id ?? "").trim(),
              name: String(value.name ?? "").trim(),
              price: Number(value.price ?? 0),
              imageUrl: value.imageUrl ? String(value.imageUrl).trim() : undefined,
              ingredientId: value.ingredientId ? String(value.ingredientId).trim() : undefined,
              qty: value.ingredientId ? Number(value.qty ?? 0) : undefined,
            };
          })
          .filter((option) => option.id && option.name)
      : [];

    const db = await getDB();
    await db.collection<ModifierGroupDoc>("modifier_groups").updateOne(
      { _id: safeId },
      {
        $set: {
          _id: safeId,
          name: String(name).trim(),
          min: Number(min),
          max: Number(max),
          required: Boolean(required),
          options: safeOptions,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[modifier-groups] POST error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo guardar el grupo de modificadores",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as ModifierGroupInput;
    const { id, name, min = 0, max = 0, required = false, options = [] } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const safeId = String(id).trim();
    const safeOptions: ModifierGroupOptionDoc[] = Array.isArray(options)
      ? options
          .map((option) => {
            const value = option as ModifierGroupOptionInput;
            return {
              id: String(value.id ?? "").trim(),
              name: String(value.name ?? "").trim(),
              price: Number(value.price ?? 0),
              ingredientId: value.ingredientId ? String(value.ingredientId).trim() : undefined,
              qty: value.ingredientId ? Number(value.qty ?? 0) : undefined,
            };
          })
          .filter((option) => option.id && option.name)
      : [];

    const db = await getDB();
    const collection = db.collection<ModifierGroupDoc>("modifier_groups");
    const exists = await collection.findOne({ _id: safeId });

    if (!exists) {
      return NextResponse.json({ error: "group_not_found" }, { status: 404 });
    }

    await collection.updateOne(
      { _id: safeId },
      {
        $set: {
          name: name !== undefined ? String(name).trim() : exists.name,
          min: Number(min),
          max: Number(max),
          required: Boolean(required),
          options: safeOptions,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[modifier-groups] PATCH error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo actualizar el grupo de modificadores",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = await getDB();
    await db.collection<ModifierGroupDoc>("modifier_groups").deleteOne({ _id: String(id).trim() });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/modifier-groups error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo eliminar el grupo de modificadores",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
