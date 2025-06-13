import React from 'react';

export default function ClienteVisualizar({ cliente, onClose }) {
  if (!cliente) return null;

  const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold">{value || '—'}</span>
    </div>
  );
  
  return (
    <div className="bg-white p-6 rounded shadow-md max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-montserrat text-primary">Detalhes do Cliente</h2>
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm font-opensans">
        <InfoItem label="Nome" value={cliente.nome} />
        <InfoItem label="CPF" value={cliente.cpf} />
        <InfoItem label="Data de Nascimento" value={cliente.dataNascimento} />
        <InfoItem label="WhatsApp" value={cliente.whatsapp} />
        <InfoItem label="Celular" value={cliente.celular} />
        <InfoItem label="Email" value={cliente.email} />
        <InfoItem label="CEP" value={cliente.cep} />
        <InfoItem label="Logradouro" value={cliente.logradouro} />
        <InfoItem label="Número" value={cliente.numero} />
        <InfoItem label="Complemento" value={cliente.complemento} />
        <InfoItem label="Bairro" value={cliente.bairro} />
        <InfoItem label="Cidade" value={cliente.cidade} />
        <InfoItem label="Estado" value={cliente.estado} />
      </div>
    </div>
  );
}
