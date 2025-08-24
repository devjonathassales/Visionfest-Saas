import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import NovaEmpresaModalForm from "../../components/Form/NovaEmpresaForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [empresaParaEditar, setEmpresaParaEditar] = useState(null);
  const [upgradeEmpresa, setUpgradeEmpresa] = useState(null);

  async function carregarEmpresas() {
    try {
      setLoading(true);
      const res = await api.get("/empresas");
      setEmpresas(res.data);
      setFiltered(res.data);
    } catch {
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    let data = empresas;
    if (statusFilter !== "todos") {
      data = data.filter((e) => e.status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.nome.toLowerCase().includes(s) ||
          (e.dominio && e.dominio.toLowerCase().includes(s))
      );
    }
    setFiltered(data);
  }, [search, statusFilter, empresas]);

  async function ativarEmpresa(id) {
    try {
      const res = await api.pa(`/empresas/${id}/ativar`);
      toast.success(res.data.mensagem);
      carregarEmpresas();
    } catch (err) {
      if (err.response?.data?.contasPendentes) {
        toast.warning("Empresa possui contas pendentes.");
      } else {
        toast.error("Erro ao ativar empresa.");
      }
    }
  }

  async function bloquearDesbloquearEmpresa(id, statusAtual) {
    try {
      const res = await api.patch(`/empresas/${id}/bloquear`);
      toast.success(res.data.mensagem);
      carregarEmpresas();
    } catch {
      toast.error("Erro ao atualizar status da empresa.");
    }
  }

  async function excluirEmpresa(id) {
    if (
      !window.confirm("Confirma exclusão da empresa? Esta ação é irreversível.")
    )
      return;

    try {
      await api.delete(`/empresas/${id}`);
      toast.success("Empresa excluída com sucesso!");
      carregarEmpresas();
    } catch {
      toast.error("Erro ao excluir empresa.");
    }
  }

  function abrirModalEditar(empresa) {
    setEmpresaParaEditar(empresa);
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEmpresaParaEditar(null);
  }

  function abrirUpgradeModal(empresa) {
    setUpgradeEmpresa(empresa);
  }

  function fecharUpgradeModal() {
    setUpgradeEmpresa(null);
  }

  return (
    <div className="pt-16 p-6 bg-gray-50 min-h-screen">
      <ToastContainer />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button
          onClick={() => {
            setEmpresaParaEditar(null);
            setModalOpen(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nova Empresa
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou domínio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="aguardando_pagamento">Aguardando Pagamento</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filtered.length === 0 ? (
        <p>Nenhuma empresa encontrada.</p>
      ) : (
        <table className="w-full border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Domínio</th>
              <th className="p-2 text-left">Plano</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="p-2">{emp.nome}</td>
                <td className="p-2">{emp.dominio}</td>
                <td className="p-2">{emp.plano?.nome || "—"}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-white ${
                      emp.statusBadge.color === "green"
                        ? "bg-green-500"
                        : emp.statusBadge.color === "red"
                        ? "bg-red-500"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    {emp.statusBadge.text}
                  </span>
                </td>
                <td className="p-2 flex gap-2 flex-wrap">
                  {emp.status !== "ativo" && (
                    <button
                      onClick={() => ativarEmpresa(emp.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() =>
                      bloquearDesbloquearEmpresa(emp.id, emp.status)
                    }
                    className={`${
                      emp.status === "bloqueado" ? "bg-green-500" : "bg-red-500"
                    } text-white px-2 py-1 rounded hover:opacity-80`}
                  >
                    {emp.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                  </button>
                  <button
                    onClick={() => abrirModalEditar(emp)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluirEmpresa(emp.id)}
                    className="bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800"
                  >
                    Excluir
                  </button>
                  {emp.podeFazerUpgrade && (
                    <button
                      onClick={() => abrirUpgradeModal(emp)}
                      className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                    >
                      Upgrade
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded shadow-lg max-w-7xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <NovaEmpresaModalForm
              onClose={fecharModal}
              onSuccess={carregarEmpresas}
              empresaParaEditar={empresaParaEditar}
            />
          </div>
        </div>
      )}

      {upgradeEmpresa && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={fecharUpgradeModal}
        >
          <div
            className="bg-white rounded shadow-lg max-w-xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Upgrade de Plano</h2>
            <p>
              Aqui você pode permitir o upgrade da empresa{" "}
              <strong>{upgradeEmpresa.nome}</strong>.
            </p>
            {/* Adicione lógica para exibir planos superiores e escolher um */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={fecharUpgradeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.success("Upgrade realizado com sucesso!");
                  fecharUpgradeModal();
                  carregarEmpresas();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Confirmar Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
