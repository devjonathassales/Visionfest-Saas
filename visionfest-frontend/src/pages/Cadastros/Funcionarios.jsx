import React, { useState } from 'react';
import FuncionarioForm from '../../components/FuncionarioForm';
import FuncionarioVisualizar from '../../components/FuncionarioVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const funcionariosMock = [
  {
    id: 1,
    nome: 'João Pereira',
    rg: '12.345.678-9',
    cpf: '000.000.000-00',
    dataNascimento: '1985-05-10',
    estadoCivil: 'Casado',
    filhos: true,
    filhosQtd: 2,
    whatsapp: '85999999999',
    email: 'joao@email.com',
    cep: '60000-000',
    logradouro: 'Rua A',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'CE',
    agencia: '1234',
    conta: '56789-0',
    pixTipo: 'email',
    pixChave: 'joao@email.com',
    dataAdmissao: '2020-01-01',
    dataDemissao: '',
    status: 'ativo',
    dataCadastro: '2020-01-01',
  },
];

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState(funcionariosMock);
  const [busca, setBusca] = useState('');
  const [showInativos, setShowInativos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [funcionarioVisualizar, setFuncionarioVisualizar] = useState(null);

  const filtrar = () => {
    return funcionarios.filter(f => {
      if (!showInativos && f.dataDemissao) return false;
      if (busca.length >= 3 && !f.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  };

  const handleSalvar = novo => {
    const atual = { ...novo, status: novo.dataDemissao ? 'inativo' : 'ativo' };
    if (novo.id) {
      setFuncionarios(prev => prev.map(f => f.id === novo.id ? atual : f));
    } else {
      atual.id = Date.now();
      atual.dataCadastro = new Date().toISOString().split('T')[0];
      setFuncionarios(prev => [...prev, atual]);
    }
    setMostrarFormulario(false);
    setFuncionarioSelecionado(null);
  };

  const handleEditar = f => {
    setFuncionarioSelecionado(f);
    setMostrarFormulario(true);
  };

  const handleExcluir = id => {
    if (window.confirm('Deseja excluir este funcionário?')) {
      setFuncionarios(prev => prev.filter(f => f.id !== id));
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
                  <td className="p-2 hidden md:table-cell">{f.status}</td>
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
        </>
      )}
    </div>
  );
}
