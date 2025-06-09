import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import PrimaryButton from '../components/PrimaryButton';

export default function ClientList() {
  const navigate = useNavigate();

  const clients = [
    { id: 1, nome: "Maria Silva", email: "maria@email.com", telefone: "(85) 99999-1234", empresa: "Buffet Estrela" },
    { id: 2, nome: "Carlos Lima", email: "carlos@email.com", telefone: "(85) 98888-5678", empresa: "Top Eventos" },
    { id: 3, nome: "Ana Costa", email: "ana@email.com", telefone: "(85) 97777-4321", empresa: "Festa Fácil" },
  ];

  const columns = ["Nome", "Email", "Telefone", "Empresa"];

  const handleDelete = (client) => {
    if (window.confirm(`Deseja realmente excluir ${client.nome}?`)) {
      console.log("Excluir cliente ID:", client.id);
      // Aqui depois virá a chamada da API
    }
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Visualize todos os clientes cadastrados"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Cadastros", path: "/cadastros" },
          { label: "Clientes" }
        ]}
      />

      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={() => navigate("/cadastros/novo-cliente")}>
          + Novo Cliente
        </PrimaryButton>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        actions={(client) => (
          <div className="flex gap-2 text-sm text-gray-700">
            <button
              onClick={() => navigate(`/cadastros/cliente/${client.id}`)}
              title="Ver"
              className="hover:text-primary"
            >
              <FiEye />
            </button>
            <button
              onClick={() => navigate(`/cadastros/editar-cliente/${client.id}`)}
              title="Editar"
              className="hover:text-yellow-600"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={() => handleDelete(client)}
              title="Excluir"
              className="hover:text-red-600"
            >
              <FiTrash />
            </button>
          </div>
        )}
      />
    </div>
  );
}
