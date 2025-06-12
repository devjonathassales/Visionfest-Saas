import React from 'react';

export default function FornecedorVisualizar({ fornecedor, onClose }) {
  if (!fornecedor) return null;

  const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold">{value || '—'}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-montserrat text-primary">Detalhes do Fornecedor</h2>
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-opensans">
        <InfoItem label="Nome" value={fornecedor.nome} />
        <InfoItem label="CPF/CNPJ" value={fornecedor.cpfCnpj} />
        <InfoItem label="Endereço" value={fornecedor.endereco} />
        <InfoItem label="WhatsApp" value={fornecedor.whatsapp} />
        <InfoItem label="Email" value={fornecedor.email} />
      </div>
    </div>
  );
}
