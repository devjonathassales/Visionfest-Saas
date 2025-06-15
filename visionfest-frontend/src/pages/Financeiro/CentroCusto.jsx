import React, { useState } from 'react';
import CentroCustoForm from '../../components/CentroCustoForm';

const dadosIniciais = [
  { id: 1, descricao: 'Aluguel', tipo: 'Custo' },
  { id: 2, descricao: 'Venda de Serviços', tipo: 'Receita' },
  { id: 3, descricao: 'Outros', tipo: 'Ambos' },
];

export default function CentroCustoReceita() {
  const [centros, setCentros] = useState(dadosIniciais);
  const [pesquisa, setPesquisa] = useState('');
  const [formAberto, setFormAberto] = useState(false);

  const filtrados = centros.filter(c =>
    c.descricao.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Pesquisar centro de custo..."
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
        <button
          className="ml-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => setFormAberto(true)}
        >
          Adicionar
        </button>
      </div>

      <table className="w-full border text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Descrição</th>
            <th className="p-2 border">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="p-2 border">{c.descricao}</td>
              <td className="p-2 border">{c.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {formAberto && (
        <CentroCustoForm
          onClose={() => setFormAberto(false)}
          onSalvar={(novo) => {
            setCentros([...centros, { ...novo, id: Date.now() }]);
            setFormAberto(false);
          }}
        />
      )}
    </div>
  );
}
