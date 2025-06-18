import React from 'react';

export default function FornecedorVisualizar({ fornecedor, onClose }) {
  if (!fornecedor) return null;

  const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-opensans">{label}</span>
      <span className="font-semibold font-opensans">{value || '—'}</span>
    </div>
  );

  return (
    // Fundo semitransparente e centralização do modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-md max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-montserrat font-bold text-[#7ED957]">
            Detalhes do Fornecedor
          </h2>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
            aria-label="Fechar detalhes do fornecedor"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-opensans text-black">
          <InfoItem label="Nome" value={fornecedor.nome} />
          <InfoItem label="CPF/CNPJ" value={fornecedor.cpfCnpj} />
          <InfoItem label="Endereço" value={fornecedor.endereco} />
          <InfoItem label="WhatsApp" value={fornecedor.whatsapp} />
          <InfoItem label="Email" value={fornecedor.email} />
        </div>
      </div>
    </div>
  );
}
