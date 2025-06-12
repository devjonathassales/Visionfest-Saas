import React, { useState } from 'react';
import FornecedorForm from '../../components/FornecedorForm';
import FornecedorVisualizar from '../../components/FornecedorVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

// Mock de fornecedores
const fornecedoresMock = [
  {
    id: 1,
    nome: 'Fornecedor A',
    cpfCnpj: '00.000.000/0001-00',
    endereco: 'Rua das Flores, 123',
    whatsapp: '85999999999',
    email: 'fornecedora@email.com',
    dataCadastro: '2024-12-10'
  },
  {
    id: 2,
    nome: 'Fornecedor B',
    cpfCnpj: '111.111.111-11',
    endereco: 'Av. Central, 456',
    whatsapp: '85988888888',
    email: 'fornecedorb@email.com',
    dataCadastro: '2025-01-15'
  },
];

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState(fornecedoresMock);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('alfabetica');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [fornecedorVisualizar, setFornecedorVisualizar] = useState(null);

  const filtrarFornecedores = () => {
    let lista = [...fornecedores];

    // Filtro por nome
    if (busca.length >= 3) {
      lista = lista.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Ordenar
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

  const handleSalvar = (novoFornecedor) => {
    if (novoFornecedor.id) {
      setFornecedores(prev => prev.map(f => f.id === novoFornecedor.id ? novoFornecedor : f));
    } else {
      setFornecedores(prev => [...prev, {
        ...novoFornecedor,
        id: Date.now(),
        dataCadastro: new Date().toISOString().split('T')[0]
      }]);
    }
    setMostrarFormulario(false);
    setFornecedorSelecionado(null);
  };

  const handleEditar = (fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setMostrarFormulario(true);
  };

  const handleExcluir = (id) => {
    if (window.confirm("Deseja excluir este fornecedor?")) {
      setFornecedores(prev => prev.filter(f => f.id !== id));
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
        </>
      )}
    </div>
  );
}
