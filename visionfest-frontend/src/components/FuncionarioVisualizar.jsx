import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function FuncionarioVisualizar({ funcionario, onClose }) {
  const { api } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!funcionario?.id) {
        setDados(null);
        return;
      }
      setLoading(true);
      setErro(null);
      try {
        const { data } = await api.get(`/api/funcionarios/${funcionario.id}`);
        if (alive) setDados(data);
      } catch (e) {
        if (alive)
          setErro(e?.response?.data?.message || "Erro ao carregar funcionário");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [funcionario, api]);

  if (!funcionario) return null;

  const Item = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-opensans">{label}</span>
      <span className="font-semibold font-opensans">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-md max-w-5xl w-full p-6">
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

        {loading && <p>Carregando...</p>}
        {erro && <p className="text-red-600">Erro: {erro}</p>}

        {!loading && !erro && dados && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm font-opensans text-black">
            <Item label="Nome" value={dados.nome} />
            <Item label="Email" value={dados.email} />
            <Item label="Função" value={dados.funcao} />
            <Item label="CPF" value={dados.cpf} />
            <Item label="RG" value={dados.rg} />
            <Item label="Nascimento" value={dados.dataNascimento} />
            <Item label="Estado Civil" value={dados.estadoCivil} />
            <Item label="Tem Filhos?" value={dados.filhos ? "Sim" : "Não"} />
            {dados.filhos ? (
              <Item label="Qtd. Filhos" value={dados.filhosQtd} />
            ) : null}
            <Item label="WhatsApp" value={dados.whatsapp} />
            <Item
              label="Endereço"
              value={[dados.logradouro, dados.numero, dados.bairro]
                .filter(Boolean)
                .join(", ")}
            />
            <Item
              label="Cidade/UF"
              value={[dados.cidade, dados.estado].filter(Boolean).join(" / ")}
            />
            <Item label="CEP" value={dados.cep} />
            <Item label="Banco" value={dados.banco} />
            <Item label="Agência" value={dados.agencia} />
            <Item label="Conta" value={dados.conta} />
            <Item label="Pix (tipo)" value={dados.pixTipo} />
            <Item label="Pix (chave)" value={dados.pixChave} />
            <Item label="Salário" value={dados.salario} />
            <Item label="Admissão" value={dados.dataAdmissao} />
            <Item label="Demissão" value={dados.dataDemissao || "Ativo"} />
            <Item label="Criado em" value={dados.createdAt} />
            <Item label="Atualizado em" value={dados.updatedAt} />
          </div>
        )}
      </div>
    </div>
  );
}
