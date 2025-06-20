import React, { useState, useEffect } from 'react';
import FuncionarioForm from '../../components/FuncionarioForm';
import FuncionarioVisualizar from '../../components/FuncionarioVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('alfabetica');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [funcionarioVisualizar, setFuncionarioVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/funcionarios`);
      if (!res.ok) throw new Error('Erro ao buscar funcionários');
      const data = await res.json();
      setFuncionarios(data);
    } catch (error) {
      alert('Erro ao carregar funcionários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const filtrarFuncionarios = () => {
    let lista = [...funcionarios];
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
      lista = lista.filter(f => {
        const data = new Date(f.dataCadastro);
        return data >= inicio && data <= fim;
      });
    }
    return lista;
  };

  const handleSalvar = async (novoFuncionario) => {
    try {
      let res;
      if (novoFuncionario.id) {
        res = await fetch(`${API_BASE_URL}/funcionarios/${novoFuncionario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoFuncionario),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/funcionarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoFuncionario),
        });
      }
      if (!res.ok) throw new Error('Erro ao salvar funcionário');
      await fetchFuncionarios();
      setMostrarFormulario(false);
      setFuncionarioSelecionado(null);
    } catch (error) {
      alert('Erro ao salvar funcionário: ' + error.message);
    }
  };

  const handleEditar = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja excluir este funcionário?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/funcionarios/${id}`, { method: 'DELETE' });

      if (res.status === 400) {
        const err = await res.json();
        throw new Error(err.error || 'Não é possível excluir este funcionário');
      }

      if (!res.ok) throw new Error('Erro ao excluir funcionário');

      setFuncionarios(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('Erro ao excluir funcionário: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      {funcionarioVisualizar && (
        <FuncionarioVisualizar
          funcionario={funcionarioVisualizar}
          onClose={() => setFuncionarioVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <FuncionarioForm
          onSave={handleSalvar}
          funcionarioSelecionado={funcionarioSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setFuncionarioSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !funcionarioVisualizar && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar funcionário..."
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
                setFuncionarioSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus /> <span className="hidden sm:inline">Novo Funcionário</span>
            </button>
          </div>

          {loading ? (
            <div>Carregando funcionários...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left hidden md:table-cell">Email</th>
                  <th className="p-2 text-left hidden md:table-cell">Cargo</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarFuncionarios().map(funcionario => (
                  <tr key={funcionario.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{funcionario.nome}</td>
                    <td className="p-2 hidden md:table-cell">{funcionario.email}</td>
                    <td className="p-2 hidden md:table-cell">{funcionario.cargo}</td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button onClick={() => setFuncionarioVisualizar(funcionario)} title="Visualizar">
                        <FiEye />
                      </button>
                      <button onClick={() => handleEditar(funcionario)} title="Editar">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleExcluir(funcionario.id)} title="Excluir">
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
