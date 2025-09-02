import React, { useState, useEffect, useMemo, useRef } from "react";
import ContratoVisualiza from "../components/ContratoVisualiza";
import { toast } from "react-toastify";
import { useAuth } from "/src/contexts/authContext.jsx";

// Constrói URL com /api no fallback (fetch)
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

export default function AgendaPage() {
  const auth = useAuth();
  // preferimos apiCliente; se não existir, tenta api
  const axiosClient = useMemo(
    () => auth?.apiCliente || auth?.api || null,
    [auth]
  );

  // Ref que expõe um GET estável (não muda a cada render)
  const httpRef = useRef({
    get: async (path, cfg = {}) => {
      const url = buildUrl(path, cfg.params);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Falha ao GET ${url}: ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      return { data };
    },
  });

  // sempre que o axios mudar, atualizamos a ref — sem quebrar a identidade do GET
  useEffect(() => {
    if (axiosClient?.get) {
      httpRef.current.get = (path, cfg = {}) => {
        // garante /api se o baseURL não tiver
        const p = path.startsWith("/") ? path : `/${path}`;
        const base = axiosClient?.defaults?.baseURL || "";
        const baseHasApi = /\/api\/?$/.test(base);
        const pathHasApi = p.startsWith("/api/");
        const finalPath = baseHasApi || pathHasApi ? p : `/api${p}`;
        return axiosClient.get(finalPath, cfg);
      };
    } else {
      // fallback fetch
      httpRef.current.get = async (path, cfg = {}) => {
        const url = buildUrl(path, cfg.params);
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Falha ao GET ${url}: ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        return { data };
      };
    }
  }, [axiosClient]);

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

  const [eventos, setEventos] = useState([]);
  const [visualizandoContrato, setVisualizandoContrato] = useState(null);
  const [loading, setLoading] = useState(false);

  // Evita refetch duplicado em StrictMode / renders consecutivos
  const lastQueryKeyRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const key = `${dataInicio}::${dataFim}`;
      if (lastQueryKeyRef.current === key) return; // mesma janela = não refaça
      lastQueryKeyRef.current = key;

      setLoading(true);
      try {
        const { data } = await httpRef.current.get("/contratos/agenda", {
          params: { dataInicio, dataFim },
        });
        if (!cancelled) setEventos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          toast.error("Erro ao carregar eventos: " + (error?.message || ""));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dataInicio, dataFim]);

  const diasDoMes = () => {
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const days = [];

    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().slice(0, 10);
      const eventosDoDia = eventos.filter((e) => e.dataEvento === dataStr);
      days.push({ data: new Date(d), eventos: eventosDoDia });
    }

    return days;
  };

  const abrirContrato = async (id) => {
    let cancelled = false;
    setLoading(true);
    try {
      const { data } = await httpRef.current.get(`/contratos/${id}`);
      if (!cancelled) setVisualizandoContrato(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao abrir contrato: " + (err?.message || ""));
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-open">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6 text-center">
        Agenda de Eventos
      </h1>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Data Inicial:</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#7ED957]"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            max={dataFim}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Data Final:</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#7ED957]"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            min={dataInicio}
          />
        </div>
      </div>

      {/* Loading simples */}
      {loading && (
        <div className="text-center text-gray-500 mb-3">Carregando...</div>
      )}

      {/* Calendário */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-[2px] min-w-[640px]">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, i) => (
            <div
              key={i}
              className="text-center font-semibold text-gray-600 bg-gray-100 py-2"
            >
              {dia}
            </div>
          ))}

          {diasDoMes().map(({ data, eventos }, index) => (
            <div
              key={index}
              className="border h-[85px] sm:h-[100px] p-[4px] rounded bg-white shadow-sm text-xs sm:text-sm overflow-hidden"
            >
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 font-semibold">
                {data.getDate().toString().padStart(2, "0")}/
                {(data.getMonth() + 1).toString().padStart(2, "0")}
              </div>

              {eventos.map((evento, i) => (
                <div
                  key={i}
                  onClick={() => abrirContrato(evento.id)}
                  className="bg-green-500 text-white text-[10px] sm:text-xs rounded px-1 py-[2px] mb-1 cursor-pointer hover:bg-green-600 truncate"
                  title={`${evento.cliente} - ${evento.tema}`}
                >
                  {evento.cliente}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualização do contrato */}
      {visualizandoContrato && (
        <ContratoVisualiza
          contrato={visualizandoContrato}
          onClose={() => setVisualizandoContrato(null)}
        />
      )}
    </div>
  );
}
