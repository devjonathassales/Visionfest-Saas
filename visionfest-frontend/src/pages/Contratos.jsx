import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ContratoForm from '../components/ContratoForm';
import ContratoVisualiza from '../components/ContratoVisualiza';
import mockContratos from '../mocks/contratosMock.json'; // vamos usar mocks por enquanto

export default function Contratos() {
  const [busca, setBusca] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState(new Date());
  const [periodoFim, setPeriodoFim] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [contratos, setContratos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarVisualiza, setMostrarVisualiza] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState(null);

  useEffect(() => {
    // Aqui no futuro será a requisição à API
    setContratos(mockContratos);
  }, []);

  const contratosFiltrados = contratos.filter((contrato) => {
    const nomeCliente = contrato.cliente?.toLowerCase() || '';
    const buscaMatch = nomeCliente.includes(busca.toLowerCase());
    const dentroPeriodo = new Date(contrato.dataEvento) >= new Date(periodoInicio) &&
                          new Date(contrato.dataEvento) <= new Date(periodoFim);
    return buscaMatch && dentroPeriodo;
  });

  const abrirNovoContrato = () => {
    setContratoSelecionado(null);
    setMostrarForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/3"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={format(periodoInicio, 'yyyy-MM-dd')}
            onChange={(e) => setPeriodoInicio(new Date(e.target.value))}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={format(periodoFim, 'yyyy-MM-dd')}
            onChange={(e) => setPeriodoFim(new Date(e.target.value))}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={abrirNovoContrato}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Novo Contrato
        </button>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Data do Evento</th>
              <th className="p-2 text-left">Horário</th>
              <th className="p-2 text-left">Buffet / Bairro</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contratosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Nenhum contrato encontrado.</td>
              </tr>
            ) : (
              contratosFiltrados.map((contrato) => (
                <tr key={contrato.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{contrato.cliente}</td>
                  <td className="p-2">{format(new Date(contrato.dataEvento), 'dd/MM/yyyy')}</td>
                  <td className="p-2">{contrato.horarioInicio}</td>
                  <td className="p-2">{contrato.buffet}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-white text-sm ${contrato.status === 'Pago' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                      {contrato.status}
                    </span>
                  </td>
                  <td className="p-2 text-center space-x-2">
                    <button
                      onClick={() => {
                        setContratoSelecionado(contrato);
                        setMostrarVisualiza(true);
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        setContratoSelecionado(contrato);
                        setMostrarForm(true);
                      }}
                      className="text-green-500 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir este contrato?')) {
                          toast.success('Contrato excluído com sucesso!');
                          // Aqui vai a lógica de exclusão e remoção de títulos
                        }
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulário */}
      {mostrarForm && (
        <ContratoForm
          contrato={contratoSelecionado}
          onClose={() => {
            setMostrarForm(false);
            setContratoSelecionado(null);
          }}
          onSalvo={() => toast.success('Contrato salvo com sucesso!')}
        />
      )}

      {/* Modal de Visualização */}
      {mostrarVisualiza && contratoSelecionado && (
        <ContratoVisualiza
          contrato={contratoSelecionado}
          onClose={() => setMostrarVisualiza(false)}
        />
      )}
    </div>
  );
}
