import React, { useEffect, useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { getToken } from "../utils/auth";

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("http://localhost:5001/api/auth/me", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    }
    fetchUser();
  }, []);

  return (
    <AdminLayout user={user}>
      <h2 className="text-2xl font-bold mb-4 text-gray-700">
        Bem-vindo, {user?.nome || "Carregando..."} 👋
      </h2>
    </AdminLayout>
  );
}
