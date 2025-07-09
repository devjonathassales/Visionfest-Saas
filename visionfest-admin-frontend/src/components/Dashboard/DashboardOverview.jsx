import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5001/api";

export default function DashboardOverview() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/dashboard`);
        const data = await res.json();
        setDados(data.dados);
      } catch (err) {
        console.error("Erro ao carregar o dashboard", err);
      }
    }
    fetchData();
  }, []);

  if (!dados) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-bold">Empresas</h3>
          <p>{dados.totalEmpresas}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-bold">Usuários Ativos</h3>
          <p>{dados.usuariosAtivos}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-bold">Faturamento</h3>
          <p>R$ {dados.faturamento}</p>
        </div>
      </div>
    </div>
  );
}
