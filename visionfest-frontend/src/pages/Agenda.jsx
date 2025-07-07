import React, { useState, useEffect, useCallback } from "react";
import ContratoVisualiza from "../components/ContratoVisualiza";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:5000/api";

export default function AgendaPage() {
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

  const fetchEventos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ dataInicio, dataFim });

      const res = await fetch(`${API_BASE_URL}/contratos/agenda?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar eventos");

      const data = await res.json();
      setEventos(data);
    } catch (error) {
      toast.error("Erro ao carregar eventos: " + error.message);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto font-open">
      {/* Header */}
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
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `${API_BASE_URL}/contratos/${evento.id}`
                      );
                      if (!res.ok) throw new Error("Erro ao buscar contrato");
                      const contrato = await res.json();
                      setVisualizandoContrato(contrato);
                    } catch (err) {
                      toast.error("Erro ao abrir contrato: " + err.message);
                    }
                  }}
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
