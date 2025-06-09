import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';

export default function ClientView() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dados mockados — no futuro, buscar da API usando o ID
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Simular chamada de API
    const mockData = {
      1: { nome: "Maria Silva", email: "maria@email.com", telefone: "(85) 99999-1234", empresa: "Buffet Estrela" },
      2: { nome: "Carlos Lima", email: "carlos@email.com", telefone: "(85) 98888-5678", empresa: "Top Eventos" },
      3: { nome: "Ana Costa", email: "ana@email.com", telefone: "(85) 97777-4321", empresa: "Festa Fácil" }
    };

    if (mockData[id]) {
      setClient(mockData[id]);
    } else {
      setClient(null);
    }
  }, [id]);

  if (!client) {
    return (
      <div>
        <PageHeader
          title="Cliente não encontrado"
          breadcrumbs={[
            { label: "Dashboard", path: "/" },
            { label: "Cadastros", path: "/cadastros" },
            { label: "Clientes", path: "/cadastros" },
            { label: "Visualização" },
          ]}
        />
        <p className="text-red-600 font-semibold">O cliente com ID {id} não foi localizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Visualização de Cliente"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Cadastros", path: "/cadastros" },
          { label: "Clientes", path: "/cadastros" },
          { label: client.nome }
        ]}
      />

      <div className="bg-white shadow-md rounded p-6 space-y-4">
        <div>
          <span className="text-sm text-gray-600 font-opensans">Nome:</span>
          <p className="text-lg font-montserrat">{client.nome}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600 font-opensans">E-mail:</span>
          <p className="text-base">{client.email}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600 font-opensans">Telefone:</span>
          <p className="text-base">{client.telefone}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600 font-opensans">Empresa:</span>
          <p className="text-base">{client.empresa}</p>
        </div>

        <div className="pt-4 flex justify-end">
          <PrimaryButton onClick={() => navigate("/cadastros")}>← Voltar</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
