import React from "react";

export default function FuncionarioVisualizar({ funcionario, onClose }) {
  if (!funcionario) return null;

  const Item = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-opensans">{label}</span>
      <span className="font-semibold font-opensans">{value || '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-md max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-montserrat font-bold text-[#7ED957]">
            Detalhes do Funcionário
          </h2>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-opensans text-black">
          <Item label="Nome" value={funcionario.nome} />
          <Item label="CPF" value={funcionario.cpf} />
          <Item label="RG" value={funcionario.rg} />
          <Item label="Data de Nascimento" value={funcionario.dataNascimento} />
          <Item label="Estado Civil" value={funcionario.estadoCivil} />
          <Item label="Tem Filhos?" value={funcionario.filhos ? "Sim" : "Não"} />
          {funcionario.filhos && <Item label="Quantidade de Filhos" value={funcionario.filhosQtd} />}
          <Item label="WhatsApp" value={funcionario.whatsapp} />
          <Item label="Email" value={funcionario.email} />
          <Item label="Endereço" value={`${funcionario.logradouro}, ${funcionario.numero} - ${funcionario.bairro}, ${funcionario.cidade} - ${funcionario.estado}`} />
          <Item label="CEP" value={funcionario.cep} />
          <Item label="Banco" value={funcionario.banco} />
          <Item label="Agência" value={funcionario.agencia} />
          <Item label="Conta" value={funcionario.conta} />
          <Item label="Tipo Chave Pix" value={funcionario.pixTipo} />
          <Item label="Chave Pix" value={funcionario.pixChave} />
          <Item label="Salário" value={funcionario.salario} />
          <Item label="Função" value={funcionario.funcao} />
          <Item label="Data de Admissão" value={funcionario.dataAdmissao} />
          <Item label="Data de Demissão" value={funcionario.dataDemissao || "Ativo"} />
        </div>
      </div>
    </div>
  );
}