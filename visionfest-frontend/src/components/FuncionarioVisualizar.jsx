import React from 'react';

export default function FuncionarioVisualizar({ funcionario, onClose }) {
  if (!funcionario) return null;
  const Info = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-montserrat text-primary">Detalhes do Funcionário</h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Fechar
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm font-opensans">
        <Info label="Nome" value={funcionario.nome} />
        <Info label="RG" value={funcionario.rg} />
        <Info label="CPF" value={funcionario.cpf} />
        <Info label="Data Nascimento" value={funcionario.dataNascimento} />
        <Info label="Estado Civil" value={funcionario.estadoCivil} />
        <Info label="Filhos" value={funcionario.filhos ? `Sim (${funcionario.filhosQtd})` : 'Não'} />
        <Info label="WhatsApp" value={funcionario.whatsapp} />
        <Info label="Email" value={funcionario.email} />
        <Info label="CEP" value={funcionario.cep} />
        <Info label="Logradouro" value={funcionario.logradouro} />
        <Info label="Número" value={funcionario.numero} />
        <Info label="Bairro" value={funcionario.bairro} />
        <Info label="Cidade" value={funcionario.cidade} />
        <Info label="Estado" value={funcionario.estado} />
        <Info label="Agência" value={funcionario.agencia} />
        <Info label="Conta" value={funcionario.conta} />
        <Info label="Pix" value={`${funcionario.pixTipo}: ${funcionario.pixChave}`} />
        <Info label="Data Admissão" value={funcionario.dataAdmissao} />
        <Info label="Data Demissão" value={funcionario.dataDemissao || '—'} />
        <Info label="Status" value={funcionario.dataDemissao ? 'Inativo' : 'Ativo'} />
      </div>
    </div>
  );
}
