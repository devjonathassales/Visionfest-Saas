import React, { useState } from 'react';
import ClienteForm from '../../components/ClienteForm';
import ClienteVisualizar from '../../components/ClienteVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

// Adicionamos 'dataCadastro' ao mock
const clientesMock = [
  {
    id: 1,
    nome: 'Amanda Rocha',
    cpf: '000.000.000-00',
    whatsapp: '85999999999',
    celular: '',
    dataNascimento: '',
    email: 'amanda@email.com',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    dataCadastro: '2024-12-10'
  },
  {
    id: 2,
    nome: 'Carlos Silva',
    cpf: '000.000.000-01',
    whatsapp: '85988888888',
    celular: '',
    dataNascimento: '',
    email: 'carlos@email.com',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    dataCadastro: '2025-01-15'
  },
];

export default function Clientes() {
  const [clientes, setClientes] = useState(clientesMock);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('alfabetica');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteVisualizar, setClienteVisualizar] = useState(null);

  const filtrarClientes = () => {
    let lista = [...clientes];

    // Filtro por nome
    if (busca.length >= 3) {
      lista = lista.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Ordenar
    if (ordenarPor === 'alfabetica') {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenarPor === 'data' && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      lista = lista.filter(cliente => {
        const data = new Date(cliente.dataCadastro);
        return data >= inicio && data <= fim;
      });
    }

    return lista;
  };

  const handleSalvar = (novoCliente) => {
    if (novoCliente.id) {
      setClientes(prev => prev.map(c => c.id === novoCliente.id ? novoCliente : c));
    } else {
      setClientes(prev => [...prev, {
        ...novoCliente,
        id: Date.now(),
        dataCadastro: new Date().toISOString().split('T')[0]
      }]);
    }
    setMostrarFormulario(false);
    setClienteSelecionado(null);
  };

  const handleEditar = (cliente) => {
    setClienteSelecionado(cliente);
    setMostrarFormulario(true);
  };

  const handleExcluir = (id) => {
    if (window.confirm("Deseja excluir este cliente?")) {
      setClientes(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-4">
      {clienteVisualizar && (
        <ClienteVisualizar
          cliente={clienteVisualizar}
          onClose={() => setClienteVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <ClienteForm
          onSave={handleSalvar}
          clienteSelecionado={clienteSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setClienteSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !clienteVisualizar && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar cliente..."
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
                setClienteSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus /> <span className="hidden sm:inline">Novo Cliente</span>
            </button>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-silver text-black">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left hidden md:table-cell">Email</th>
                <th className="p-2 text-left hidden md:table-cell">WhatsApp</th>
                <th className="p-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrarClientes().map(cliente => (
                <tr key={cliente.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{cliente.nome}</td>
                  <td className="p-2 hidden md:table-cell">{cliente.email}</td>
                  <td className="p-2 hidden md:table-cell">{cliente.whatsapp}</td>
                  <td className="p-2 flex justify-center gap-2 text-primary">
                    <button onClick={() => setClienteVisualizar(cliente)} title="Visualizar">
                      <FiEye />
                    </button>
                    <button onClick={() => handleEditar(cliente)} title="Editar">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleExcluir(cliente.id)} title="Excluir">
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
