"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();



  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="p-6">Cargando...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard EasyPOS</h1>
      <p className="text-gray-600 mt-2">Sesión activa: {user.email}</p>
      <button
  className="mt-4 underline text-sm"
  onClick={() => signOut(auth)}
>
  Cerrar sesión
</button>

    </div>
  );
  
}
