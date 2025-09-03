import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function SuporteAdminPage() {
  const { api } = useAuth(); // no admin, vocês têm usado api()
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const { data } = await api(`/admin/suporte/chamados${qs}`);
      setItems(data || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [status]);

  const alterarStatus = async (id, novo) => {
    try {
      await api(`/admin/suporte/chamados/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: novo }),
        headers: { "Content-Type": "application/json" },
      });
      await carregar();
    } catch (e) {
      alert("Erro ao alterar status");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-open">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-4">
        Suporte — Chamados
      </h1>

      <div className="mb-4 flex gap-3 items-center">
        <span>Filtrar status:</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Todos</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em andamento</option>
          <option value="resolvido">Resolvido</option>
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Nenhum chamado.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Empresa</th>
                <th className="py-2 px-3">Usuário</th>
                <th className="py-2 px-3">Assunto</th>
                <th className="py-2 px-3">Prioridade</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Criado em</th>
                <th className="py-2 px-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{c.id}</td>
                  <td className="py-2 px-3">{c.empresaNome || c.empresaId}</td>
                  <td className="py-2 px-3">
                    {c.usuarioNome || c.usuarioId || "-"}
                  </td>
                  <td className="py-2 px-3">{c.assunto}</td>
                  <td className="py-2 px-3 capitalize">{c.prioridade}</td>
                  <td className="py-2 px-3">{c.status.replace("_", " ")}</td>
                  <td className="py-2 px-3">
                    {new Date(c.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={c.status}
                      onChange={(e) => alterarStatus(c.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="aberto">Aberto</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="resolvido">Resolvido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
