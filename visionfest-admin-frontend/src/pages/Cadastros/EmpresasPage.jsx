import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import NovaEmpresaModalForm from "../../components/Form/NovaEmpresaForm"; // confirme o path

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);

  async function carregarEmpresas() {
    try {
      setLoading(true);
      const res = await api.get("/empresas");
      setEmpresas(res.data);
      setFiltered(res.data);
    } catch {
      alert("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    let filteredData = empresas;

    if (statusFilter !== "todos") {
      filteredData = filteredData.filter(
        (e) => (e.status || "ativo").toLowerCase() === statusFilter
      );
    }

    if (search) {
      const s = search.toLowerCase();
      filteredData = filteredData.filter(
        (e) =>
          e.nome.toLowerCase().includes(s) ||
          (e.dominio && e.dominio.toLowerCase().includes(s)) ||
          (e.status && e.status.toLowerCase().includes(s))
      );
    }

    setFiltered(filteredData);
  }, [search, statusFilter, empresas]);

  // Fecha modal com tecla ESC
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    }
    if (modalOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [modalOpen]);

  return (
    <div className="pt-16 p-6 bg-gray-50 min-h-screen">
      {/* pt-16 = espaço para o header fixo */}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nova Empresa
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, domínio ou status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {["todos", "ativo", "inativo", "bloqueado"].map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <p>Nenhuma empresa encontrada.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2 text-left">Nome</th>
              <th className="border border-gray-300 p-2 text-left">Domínio</th>
              <th className="border border-gray-300 p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-100 cursor-default">
                <td className="border border-gray-300 p-2">{emp.nome}</td>
                <td className="border border-gray-300 p-2">{emp.dominio}</td>
                <td className="border border-gray-300 p-2">{emp.status || "ativo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded shadow-lg max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <NovaEmpresaModalForm
              onClose={() => setModalOpen(false)}
              onSuccess={carregarEmpresas}
            />
          </div>
        </div>
      )}
    </div>
  );
}
