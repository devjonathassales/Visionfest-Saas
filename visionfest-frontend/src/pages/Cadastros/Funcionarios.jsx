import React, { useState, useEffect } from 'react';
import FuncionarioForm from '../../components/FuncionarioForm';
import FuncionarioVisualizar from '../../components/FuncionarioVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [showInativos, setShowInativos] = useState(false);
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
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const filtrar = () => {
    return funcionarios.filter(f => {
      if (!showInativos && f.dataDemissao) return false;
      if (busca.length >= 3 && !f.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  };

  const handleSalvar = async (novo) => {
    try {
      const metodo = novo.id ? 'PUT' : 'POST';
      const url = novo.id
        ? `${API_BASE_URL}/funcionarios/${novo.id}`
        : `${API_BASE_URL}/funcionarios`;

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo),
      });

      if (!res.ok) throw new Error('Erro ao salvar funcionário');

      await fetchFuncionarios();
      setMostrarFormulario(false);
      setFuncionarioSelecionado(null);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleEditar = (func) => {
    setFuncionarioSelecionado(func);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir este funcionário?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/funcionarios/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao excluir');

      setFuncionarios(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
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
            <div className="flex items-center gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar funcionário..."
                className="input border border-gray-300 px-3 py-2 rounded w-full"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              <label className="inline-flex items-center ml-2">
                <input
                  type="checkbox"
                  checked={showInativos}
                  onChange={() => setShowInativos(!showInativos)}
                  className="form-checkbox"
                />
                <span className="ml-1 text-sm">Mostrar inativos</span>
              </label>
            </div>
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
                  <th className="p-2 text-left hidden md:table-cell">CPF</th>
                  <th className="p-2 text-left hidden md:table-cell">Admissão</th>
                  <th className="p-2 text-left hidden md:table-cell">Status</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrar().map(f => (
                  <tr key={f.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{f.nome}</td>
                    <td className="p-2 hidden md:table-cell">{f.cpf}</td>
                    <td className="p-2 hidden md:table-cell">{f.dataAdmissao}</td>
                    <td className="p-2 hidden md:table-cell">
                      {f.dataDemissao ? 'Inativo' : 'Ativo'}
                    </td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button onClick={() => setFuncionarioVisualizar(f)} title="Visualizar">
                        <FiEye />
                      </button>
                      <button onClick={() => handleEditar(f)} title="Editar">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleExcluir(f.id)} title="Excluir">
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
