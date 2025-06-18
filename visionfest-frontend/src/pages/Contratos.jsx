import React, { useState } from 'react';
import ContratoForm from '../components/ContratoForm';
import ContratoVisualiza from '../components/ContratoVisualiza';

const contratosMock = [
  {
    id: 1,
    cliente: 'Ana Souza',
    dataEvento: '2025-06-25',
    horarioInicio: '18:00',
    local: 'Buffet Infantil Estrelinha',
    bairro: 'Centro',
    status: 'Parcialmente Pago',
  },
  {
    id: 2,
    cliente: 'Carlos Mendes',
    dataEvento: '2025-06-20',
    horarioInicio: '20:00',
    local: 'Buffet Requinte',
    bairro: 'Aldeota',
    status: 'Totalmente Pago',
  },
];

export default function ContratosPage() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [visualizandoContrato, setVisualizandoContrato] = useState(null);

  const abrirFormulario = () => setMostrarForm(true);
  const fecharFormulario = () => setMostrarForm(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-600">Contratos</h1>
        <button
          onClick={abrirFormulario}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Novo Contrato
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <input type="text" placeholder="Pesquisar cliente..." className="border p-2 rounded w-full md:w-1/3" />
        <input type="month" className="border p-2 rounded w-full md:w-1/3" defaultValue="2025-06" />
      </div>

      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Cliente</th>
              <th className="border px-4 py-2">Data do Evento</th>
              <th className="border px-4 py-2">Início</th>
              <th className="border px-4 py-2">Local</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratosMock.map((contrato) => (
              <tr key={contrato.id}>
                <td className="border px-4 py-2">{contrato.cliente}</td>
                <td className="border px-4 py-2">{contrato.dataEvento}</td>
                <td className="border px-4 py-2">{contrato.horarioInicio}</td>
                <td className="border px-4 py-2">{contrato.local} - {contrato.bairro}</td>
                <td className="border px-4 py-2">{contrato.status}</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setVisualizandoContrato(contrato)}
                  >
                    Visualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarForm && <ContratoForm onClose={fecharFormulario} />}
      {visualizandoContrato && (
        <ContratoVisualiza
          contrato={visualizandoContrato}
          onClose={() => setVisualizandoContrato(null)}
        />
      )}
    </div>
  );
}
