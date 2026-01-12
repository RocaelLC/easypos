"use client";

import { useRouter } from "next/navigation";

export default function MobileTopBar({
  title,
  backTo = "/dashboard",
}: {
  title?: string;
  backTo?: string;
}) {
  const router = useRouter();

  return (
    <div className="md:hidden sticky top-0 z-50 bg-neutral-950 border-b border-neutral-800">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => router.push(backTo)}
          className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
        >
          ←
        </button>

        <div className="text-sm font-semibold truncate">
          {title ?? "EasyPOS"}
        </div>
      </div>
    </div>
  );
}
