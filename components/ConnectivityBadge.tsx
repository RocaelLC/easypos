"use client";
import { useEffect, useState } from "react";
import { syncQueuedSales } from "@/lib/salesService";

export default function ConnectivityBadge() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOn = () => {
      setOnline(true);
      syncQueuedSales();
    };
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  return (
    <span
      className={`text-xs rounded-full px-2 py-1 ${
        online ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      }`}
    >
      {online ? "Online" : "Offline"}
    </span>
  );
}
