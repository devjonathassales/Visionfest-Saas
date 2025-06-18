import React, { useState, useEffect } from 'react';
import FornecedorForm from '../../components/FornecedorForm';
import FornecedorVisualizar from '../../components/FornecedorVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('alfabetica');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [fornecedorVisualizar, setFornecedorVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buscar fornecedores do backend
  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fornecedores`);
      if (!res.ok) throw new Error('Erro ao buscar fornecedores');
      const data = await res.json();
      setFornecedores(data);
    } catch (error) {
      alert('Erro ao carregar fornecedores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const filtrarFornecedores = () => {
    let lista = [...fornecedores];

    if (busca.length >= 3) {
      lista = lista.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (ordenarPor === 'alfabetica') {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenarPor === 'data' && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      lista = lista.filter(fornecedor => {
        const data = new Date(fornecedor.dataCadastro);
        return data >= inicio && data <= fim;
      });
    }

    return lista;
  };

  const handleSalvar = async (novoFornecedor) => {
    try {
      let res;
      if (novoFornecedor.id) {
        // Atualizar fornecedor
        res = await fetch(`${API_BASE_URL}/fornecedores/${novoFornecedor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoFornecedor),
        });
      } else {
        // Criar fornecedor
        res = await fetch(`${API_BASE_URL}/fornecedores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoFornecedor),
        });
      }

      if (!res.ok) throw new Error('Erro ao salvar fornecedor');

      await fetchFornecedores();

      setMostrarFormulario(false);
      setFornecedorSelecionado(null);
    } catch (error) {
      alert('Erro ao salvar fornecedor: ' + error.message);
    }
  };

  const handleEditar = (fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja excluir este fornecedor?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/fornecedores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir fornecedor');
      setFornecedores(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('Erro ao excluir fornecedor: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      {fornecedorVisualizar && (
        <FornecedorVisualizar
          fornecedor={fornecedorVisualizar}
          onClose={() => setFornecedorVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <FornecedorForm
          onSave={handleSalvar}
          fornecedorSelecionado={fornecedorSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setFornecedorSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !fornecedorVisualizar && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar fornecedor..."
                className="input border border-gray-300 px-3 py-2 rounded w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="input border border-gray-300 px-3 py-2 rounded"
              >
                <option value="alfabetica">Ordem Alfabética</option>
                <option value="data">Data de Cadastro</option>
              </select>
            </div>

            {ordenarPor === 'data' && (
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="date"
                  className="input border border-gray-300 px-3 py-2 rounded"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
                <input
                  type="date"
                  className="input border border-gray-300 px-3 py-2 rounded"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={() => {
                setFornecedorSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus /> <span className="hidden sm:inline">Novo Fornecedor</span>
            </button>
          </div>

          {loading ? (
            <p>Carregando fornecedores...</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left hidden md:table-cell">CPF/CNPJ</th>
                  <th className="p-2 text-left hidden md:table-cell">Endereço</th>
                  <th className="p-2 text-left hidden md:table-cell">Email</th>
                  <th className="p-2 text-left hidden md:table-cell">WhatsApp</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarFornecedores().map(fornecedor => (
                  <tr key={fornecedor.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{fornecedor.nome}</td>
                    <td className="p-2 hidden md:table-cell">{fornecedor.cpfCnpj}</td>
                    <td className="p-2 hidden md:table-cell">{fornecedor.endereco}</td>
                    <td className="p-2 hidden md:table-cell">{fornecedor.email}</td>
                    <td className="p-2 hidden md:table-cell">{fornecedor.whatsapp}</td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button onClick={() => setFornecedorVisualizar(fornecedor)} title="Visualizar">
                        <FiEye />
                      </button>
                      <button onClick={() => handleEditar(fornecedor)} title="Editar">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleExcluir(fornecedor.id)} title="Excluir">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
