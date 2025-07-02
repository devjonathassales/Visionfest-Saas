import React, { useState, useEffect, useCallback } from "react";
import ContratoWizard from "../components/ContratoWizard";
import ContratoVisualiza from "../components/ContratoVisualiza";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:5000/api";

export default function ContratosPage() {
  const [mostrarWizard, setMostrarWizard] = useState(false);
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
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return ultimoDia.toISOString().slice(0, 10);
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

  return (
    <div className="p-6 max-w-7xl mx-auto font-open">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat">
          Contratos
        </h1>

        <button
          onClick={() => setMostrarWizard(true)}
          className="bg-[#7ED957] text-white px-5 py-2 rounded hover:bg-green-700 transition"
        >
          Novo Contrato
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Pesquisar cliente..."
          className="border border-gray-300 rounded px-4 py-2 flex-1 min-w-[180px] focus:outline-none focus:border-[#7ED957]"
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />

        <div className="flex gap-2 items-center min-w-[320px]">
          <label
            htmlFor="dataInicio"
            className="font-semibold whitespace-nowrap"
          >
            Data Início:
          </label>
          <input
            id="dataInicio"
            type="date"
            className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:border-[#7ED957]"
            value={dataInicio}
            max={dataFim}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <label htmlFor="dataFim" className="font-semibold whitespace-nowrap">
            Data Fim:
          </label>
          <input
            id="dataFim"
            type="date"
            className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:border-[#7ED957]"
            value={dataFim}
            min={dataInicio}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded shadow">
        <table className="w-full table-auto border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-3 text-left">Cliente</th>
              <th className="border px-4 py-3">Data do Evento</th>
              <th className="border px-4 py-3">Início</th>
              <th className="border px-4 py-3">Término</th>
              <th className="border px-4 py-3">Local</th>
              <th className="border px-4 py-3">Status</th>
              <th className="border px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            ) : (
              contratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-gray-50">
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
                    <button
                      onClick={() => setVisualizandoContrato(contrato)}
                      className="text-[#7ED957] font-semibold hover:underline"
                      title="Visualizar Contrato"
                    >
                      Visualizar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarWizard && (
        <ContratoWizard
          onFinalizar={() => {
            setMostrarWizard(false);
            fetchContratos();
          }}
        />
      )}

      {visualizandoContrato && (
        <ContratoVisualiza
          contrato={visualizandoContrato}
          onClose={() => setVisualizandoContrato(null)}
        />
      )}
    </div>
  );
}
