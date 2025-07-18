import React, { useState, useEffect, useCallback } from "react";
import ContratoWizard from "../components/ContratoWizard";
import ContratoVisualiza from "../components/ContratoVisualiza";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api";

export default function ContratosPage() {
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [contratoIdEdicao, setContratoIdEdicao] = useState(null);
  const [visualizandoContrato, setVisualizandoContrato] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState("");

  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  });

  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
  });

  const fetchContratos = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        cliente: filtroCliente,
        dataInicio,
        dataFim,
      });

      const res = await fetch(`${API_BASE_URL}/contratos?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar contratos");

      const data = await res.json();

      const formatado = data.map((contrato) => ({
        ...contrato,
        numeroContrato: contrato.numeroContrato || contrato.id, // adiciona número do contrato
        cliente: contrato.Cliente?.nome || "Cliente não identificado",
        local: contrato.localEvento || contrato.nomeBuffet || "—",
        bairro: contrato.bairro || "—",
        status: contrato.statusPagamento,
      }));

      setContratos(formatado);
    } catch (error) {
      toast.error("Erro ao carregar contratos: " + error.message);
    }
  }, [filtroCliente, dataInicio, dataFim]);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const excluirContrato = async (id) => {
    if (!window.confirm("Deseja realmente excluir este contrato?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/contratos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir contrato");

      toast.success("Contrato excluído com sucesso!");
      fetchContratos();
    } catch (err) {
      toast.error("Erro ao excluir contrato: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-open">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat">
          Contratos
        </h1>

        <button
          onClick={() => {
            setContratoIdEdicao(null);
            setMostrarWizard(true);
          }}
          className="bg-[#7ED957] text-white px-5 py-2 rounded hover:bg-green-700 transition"
        >
          Novo Contrato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Pesquisar cliente..."
          className="border border-gray-300 rounded px-4 py-2 flex-1 min-w-[180px] focus:outline-none focus:border-[#7ED957]"
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 items-center min-w-[320px]">
          <label htmlFor="dataInicio" className="font-semibold">
            Data Início:
          </label>
          <input
            id="dataInicio"
            type="date"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            value={dataInicio}
            max={dataFim}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <label htmlFor="dataFim" className="font-semibold">
            Data Fim:
          </label>
          <input
            id="dataFim"
            type="date"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            value={dataFim}
            min={dataInicio}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded shadow">
        <table className="w-full table-auto border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-4 py-3"># Contrato</th>
              <th className="border px-4 py-3">Cliente</th>
              <th className="border px-4 py-3 text-center">Data</th>
              <th className="border px-4 py-3 text-center">Início</th>
              <th className="border px-4 py-3 text-center">Término</th>
              <th className="border px-4 py-3">Local</th>
              <th className="border px-4 py-3 text-center">Status</th>
              <th className="border px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            ) : (
              contratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{contrato.numeroContrato}</td>
                  <td className="border px-4 py-2">{contrato.cliente}</td>
                  <td className="border px-4 py-2 text-center">
                    {contrato.dataEvento}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {contrato.horarioInicio}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {contrato.horarioTermino || "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {contrato.local} - {contrato.bairro}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {contrato.status}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <div className="flex justify-center gap-2 text-sm">
                      <button
                        onClick={() => setVisualizandoContrato(contrato)}
                        className="text-[#7ED957] hover:underline"
                        title="Visualizar"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setContratoIdEdicao(contrato.id);
                          setMostrarWizard(true);
                        }}
                        className="text-blue-500 hover:underline"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => excluirContrato(contrato.id)}
                        className="text-red-500 hover:underline"
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modais */}
      {mostrarWizard && (
        <ContratoWizard
          contratoId={contratoIdEdicao}
          onFinalizar={() => {
            setMostrarWizard(false);
            setContratoIdEdicao(null);
            setVisualizandoContrato(null);
            fetchContratos();
          }}
        />
      )}

      {visualizandoContrato && !mostrarWizard && (
        <ContratoVisualiza
          contrato={visualizandoContrato}
          onClose={() => setVisualizandoContrato(null)}
        />
      )}
    </div>
  );
}
