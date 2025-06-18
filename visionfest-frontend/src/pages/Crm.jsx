import React, { useState } from "react";

const leadsMock = [
  {
    id: 1,
    nome: "Maria Silva",
    telefone: "(11) 91234-5678",
    evento: "Aniversário",
    status: "novo",
    data: "2025-06-20",
    observacao: "Indicada por cliente antigo.",
  },
  {
    id: 2,
    nome: "Carlos Mendes",
    telefone: "(85) 99876-4321",
    evento: "Casamento",
    status: "contato",
    data: "2025-06-22",
    observacao: "Gostou do Instagram.",
  },
  {
    id: 3,
    nome: "Luciana Rocha",
    telefone: "(31) 93456-7890",
    evento: "Chá Revelação",
    status: "proposta",
    data: "2025-06-25",
    observacao: "Aguardando confirmação.",
  },
  {
    id: 4,
    nome: "Roberto Nunes",
    telefone: "(21) 98765-1234",
    evento: "Festa de 15 anos",
    status: "fechado",
    data: "2025-06-28",
    observacao: "Cliente recorrente.",
  },
  {
    id: 5,
    nome: "Fernanda Costa",
    telefone: "(11) 91234-9999",
    evento: "Corporativo",
    status: "perdido",
    data: "2025-06-19",
    observacao: "Optou por concorrente.",
  },
];

export default function CrmPage() {
  const [leads] = useState(leadsMock);
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [filtroInicial, setFiltroInicial] = useState("");
  const [filtroFinal, setFiltroFinal] = useState("");

  const colunas = [
    { chave: "novo", titulo: "Novo Lead", cor: "bg-blue-100" },
    { chave: "contato", titulo: "Contato Realizado", cor: "bg-yellow-100" },
    { chave: "proposta", titulo: "Proposta Enviada", cor: "bg-purple-100" },
    { chave: "fechado", titulo: "Fechamento", cor: "bg-green-100" },
    { chave: "perdido", titulo: "Perdido", cor: "bg-red-100" },
  ];

  const leadsFiltrados = leads.filter((lead) => {
    const dataLead = new Date(lead.data);
    const inicio = filtroInicial ? new Date(filtroInicial) : null;
    const fim = filtroFinal ? new Date(filtroFinal) : null;
    if (inicio && dataLead < inicio) return false;
    if (fim && dataLead > fim) return false;
    return true;
  });

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-green-600">CRM - Gestão de Leads</h1>

      {/* Filtros de período */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Data Inicial</label>
          <input
            type="date"
            value={filtroInicial}
            onChange={(e) => setFiltroInicial(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Data Final</label>
          <input
            type="date"
            value={filtroFinal}
            onChange={(e) => setFiltroFinal(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Colunas estilo Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {colunas.map((coluna) => (
          <div key={coluna.chave} className={`rounded shadow p-3 ${coluna.cor}`}>
            <h2 className="font-bold text-lg mb-2 text-gray-700">{coluna.titulo}</h2>
            {leadsFiltrados
              .filter((lead) => lead.status === coluna.chave)
              .map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setLeadSelecionado(lead)}
                  className="bg-white rounded p-3 mb-2 shadow cursor-pointer hover:bg-gray-50"
                >
                  <strong>{lead.nome}</strong>
                  <p className="text-sm text-gray-600">{lead.evento}</p>
                  <p className="text-xs text-gray-500">{lead.data}</p>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Modal do lead selecionado */}
      {leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md relative shadow-lg">
            <button
              onClick={() => setLeadSelecionado(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-600 text-xl font-bold"
              aria-label="Fechar"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-2">{leadSelecionado.nome}</h3>
            <p><strong>Telefone:</strong> {leadSelecionado.telefone}</p>
            <p><strong>Evento:</strong> {leadSelecionado.evento}</p>
            <p><strong>Data:</strong> {leadSelecionado.data}</p>
            <p><strong>Status:</strong> {leadSelecionado.status}</p>
            <p><strong>Observações:</strong> {leadSelecionado.observacao}</p>
          </div>
        </div>
      )}
    </div>
  );
}
