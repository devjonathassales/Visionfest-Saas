import React, { useState, useEffect, useMemo, useCallback } from "react";
import ContratoWizard from "../components/ContratoWizard";
import ContratoVisualiza from "../components/ContratoVisualiza";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "/src/contexts/authContext.jsx";

// monta URL com /api no fallback (fetch)
function buildUrl(path, params = {}) {
  const clean = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(clean, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

export default function ContratosPage() {
  const auth = useAuth();
  const apiCliente = auth?.apiCliente;
  const api = auth?.api;

  // escolhe cliente axios disponível
  const http = useMemo(() => {
    if (apiCliente?.get) return apiCliente;
    if (api?.get) return api;
    return null;
  }, [apiCliente, api]);

  // garante que rotas axios tenham /api quando necessário
  const withApi = useCallback(
    (path) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      const base = http?.defaults?.baseURL || "";
      const baseHasApi = /\/api\/?$/.test(base);
      const pathHasApi = p.startsWith("/api/");
      if (baseHasApi || pathHasApi) return p;
      return `/api${p}`;
    },
    [http]
  );

  const httpGet = async (path, cfg = {}) => {
    if (http?.get) {
      return http.get(withApi(path), cfg); // axios
    }
    const url = buildUrl(path, cfg.params);
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Falha ao GET ${url}: ${res.status}`);
    }
    const data = await res.json().catch(() => ({}));
    return { data };
  };

  const httpDelete = async (path) => {
    if (http?.delete) {
      return http.delete(withApi(path)); // axios
    }
    const url = buildUrl(path);
    const res = await fetch(url, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Falha ao DELETE ${url}: ${res.status}`);
    }
    return {};
  };

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
      const params = { cliente: filtroCliente, dataInicio, dataFim };
      const { data } = await httpGet("/contratos", { params });

      const formatado = (Array.isArray(data) ? data : []).map((contrato) => ({
        ...contrato,
        numeroContrato: contrato.numeroContrato || contrato.id,
        cliente: contrato.Cliente?.nome || "Cliente não identificado",
        local: contrato.localEvento || contrato.nomeBuffet || "—",
        bairro: contrato.bairro || "—",
        status: contrato.statusPagamento,
      }));

      setContratos(formatado);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar contratos: " + (error?.message || ""));
    }
  }, [httpGet, filtroCliente, dataInicio, dataFim]);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const excluirContrato = async (id) => {
    if (!window.confirm("Deseja realmente excluir este contrato?")) return;
    try {
      await httpDelete(`/contratos/${id}`);
      toast.success("Contrato excluído com sucesso!");
      fetchContratos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir contrato: " + (err?.message || ""));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-open">
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
                  <td className="border px-4 py-2">
                    {contrato.numeroContrato}
                  </td>
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
