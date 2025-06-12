import React, { useState } from 'react';
import ClienteForm from '../../components/ClienteForm';
import ClienteVisualizar from '../../components/ClienteVisualizar';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const clientesMock = [
  { id: 1, nome: 'Amanda Rocha', cpf: '000.000.000-00', whatsapp: '85999999999', celular: '', dataNascimento: '', email: 'amanda@email.com', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
  { id: 2, nome: 'Carlos Silva', cpf: '000.000.000-01', whatsapp: '85988888888', celular: '', dataNascimento: '', email: 'carlos@email.com', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
];

export default function Clientes() {
  const [clientes, setClientes] = useState(clientesMock);
  const [busca, setBusca] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteVisualizar, setClienteVisualizar] = useState(null);

  const filtrarClientes = () => {
    if (busca.length < 3) return clientes;
    return clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  };

  const handleSalvar = (novoCliente) => {
    if (novoCliente.id) {
      setClientes(prev => prev.map(c => c.id === novoCliente.id ? novoCliente : c));
    } else {
      setClientes(prev => [...prev, { ...novoCliente, id: Date.now() }]);
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
      {/* VISUALIZAR */}
      {clienteVisualizar && (
        <ClienteVisualizar
          cliente={clienteVisualizar}
          onClose={() => setClienteVisualizar(null)}
        />
      )}

      {/* FORMULÁRIO */}
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

      {/* LISTAGEM */}
      {!mostrarFormulario && !clienteVisualizar && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="input w-full border border-gray-300 px-3 py-2 rounded"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {/* Filtro opcional */}
            </div>
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
                    <button
                      onClick={() => setClienteVisualizar(cliente)}
                      title="Visualizar"
                    >
                      <FiEye className="mx-auto" />
                    </button>
                    <button
                      onClick={() => handleEditar(cliente)}
                      title="Editar"
                    >
                      <FiEdit className="mx-auto" />
                    </button>
                    <button
                      onClick={() => handleExcluir(cliente.id)}
                      title="Excluir"
                    >
                      <FiTrash2 className="mx-auto" />
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
