"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "admin" ? "/admin/users" : "/dashboard");
  }, [router]);

  return <main className="min-h-screen bg-[#0B0F19]" />;
}

