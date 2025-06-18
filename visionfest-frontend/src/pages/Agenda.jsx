import React, { useState, useEffect } from "react";

const contratosMock = [
  {
    id: 1,
    cliente: "Maria Silva",
    dataEvento: "2025-06-20",
    horaInicio: "18:00",
    horaFim: "22:00",
    tema: "Aniversário",
    endereco: "Rua A, 123",
  },
  {
    id: 2,
    cliente: "João Souza",
    dataEvento: "2025-06-22",
    horaInicio: "10:00",
    horaFim: "14:00",
    tema: "Casamento",
    endereco: "Buffet Jardim",
  },
  {
    id: 3,
    cliente: "Ana Paula",
    dataEvento: "2025-07-01",
    horaInicio: "19:00",
    horaFim: "23:00",
    tema: "Formatura",
    endereco: "Salão Central",
  },
];

export default function AgendaPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [popupEvento, setPopupEvento] = useState(null);

  useEffect(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicio(primeiroDia.toISOString().slice(0, 10));
    setDataFim(ultimoDia.toISOString().slice(0, 10));
  }, []);

  const diasDoMes = () => {
    if (!dataInicio || !dataFim) return [];
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const days = [];

    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    for (
      let d = new Date(firstDay);
      d <= lastDay;
      d.setDate(d.getDate() + 1)
    ) {
      const dataStr = d.toISOString().slice(0, 10);
      const eventosDoDia = contratosMock.filter(
        (e) => e.dataEvento === dataStr
      );
      days.push({ data: new Date(d), eventos: eventosDoDia });
    }

    return days;
  };

  useEffect(() => {
    const escFunction = (e) => {
      if (e.key === "Escape") setPopupEvento(null);
    };
    document.addEventListener("keydown", escFunction);
    return () => document.removeEventListener("keydown", escFunction);
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-full sm:max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-green-600">
        Agenda de Eventos
      </h1>

      {/* Filtros de Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-4 items-end mb-6">
        <div className="w-full">
          <label className="text-sm font-semibold block">Data Inicial:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="w-full">
          <label className="text-sm font-semibold block">Data Final:</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Calendário em grid responsivo */}
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
                  onClick={() => setPopupEvento(evento)}
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

      {/* Modal de evento */}
      {popupEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full relative shadow-lg">
            <button
              onClick={() => setPopupEvento(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-600 font-bold text-xl"
            >
              ×
            </button>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-green-700">
              {popupEvento.cliente}
            </h3>
            <p>
              <strong>Tema:</strong> {popupEvento.tema || "Não informado"}
            </p>
            <p>
              <strong>Data:</strong> {popupEvento.dataEvento}
            </p>
            <p>
              <strong>Horário:</strong> {popupEvento.horaInicio} às{" "}
              {popupEvento.horaFim}
            </p>
            <p>
              <strong>Endereço:</strong> {popupEvento.endereco}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
