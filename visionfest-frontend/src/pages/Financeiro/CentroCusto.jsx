import React, { useState, useEffect } from 'react';
import CentroCustoForm from '../../components/CentroCustoForm';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api/centros-custo';

export default function CentroCustoReceita() {
  const [centros, setCentros] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [centroSelecionado, setCentroSelecionado] = useState(null);

  const fetchCentros = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Erro ao buscar centros de custo');
      const data = await res.json();
      setCentros(data);
    } catch (error) {
      alert('Erro ao carregar centros: ' + error.message);
    }
  };

  useEffect(() => {
    fetchCentros();
  }, []);

  const filtrados = centros.filter(c =>
    c.descricao.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleSalvar = async (dados) => {
    try {
      const method = dados.id ? 'PUT' : 'POST';
      const url = dados.id ? `${API_BASE_URL}/${dados.id}` : API_BASE_URL;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      await fetchCentros();
      setFormAberto(false);
      setCentroSelecionado(null);
    } catch (err) {
      alert('Erro ao salvar centro: ' + err.message);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este centro?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (res.status === 400) {
        const data = await res.json();
        alert(data.error || 'Este centro não pode ser excluído.');
        return;
      }

      if (!res.ok) throw new Error('Erro ao excluir');

      await fetchCentros();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

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
          onClick={() => {
            setCentroSelecionado(null);
            setFormAberto(true);
          }}
        >
          <FiPlus className="inline mr-1" />
          Adicionar
        </button>
      </div>

      <table className="w-full border text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Descrição</th>
            <th className="p-2 border">Tipo</th>
            <th className="p-2 border text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="p-2 border">{c.descricao}</td>
              <td className="p-2 border">{c.tipo}</td>
              <td className="p-2 border text-center flex justify-center gap-3">
                <button
                  onClick={() => {
                    setCentroSelecionado(c);
                    setFormAberto(true);
                  }}
                  title="Editar"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleExcluir(c.id)}
                  title="Excluir"
                  className="text-red-500"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {formAberto && (
        <CentroCustoForm
          onClose={() => {
            setCentroSelecionado(null);
            setFormAberto(false);
          }}
          onSalvar={handleSalvar}
          centroSelecionado={centroSelecionado}
        />
      )}
    </div>
  );
}
