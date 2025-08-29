import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function FornecedorVisualizar({ fornecedor, onClose }) {
  const { api } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!fornecedor?.id) {
        setDados(null);
        return;
      }
      setLoading(true);
      setErro(null);
      try {
        const { data } = await api.get(`/api/fornecedores/${fornecedor.id}`);
        if (alive) setDados(data);
      } catch (e) {
        if (alive)
          setErro(e?.response?.data?.message || "Erro ao carregar fornecedor");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [fornecedor, api]);

  if (!fornecedor) return null;

  const Item = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-opensans">{label}</span>
      <span className="font-semibold font-opensans">{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-md max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-montserrat font-bold text-[#7ED957]">
            Detalhes do Fornecedor
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-opensans text-black">
            <Item label="Nome" value={dados.nome} />
            <Item label="CPF/CNPJ" value={dados.cpfCnpj} />
            <Item label="Endereço" value={dados.endereco} />
            <Item label="Email" value={dados.email} />
            <Item label="WhatsApp" value={dados.whatsapp} />
            <Item label="Criado em" value={dados.createdAt} />
            <Item label="Atualizado em" value={dados.updatedAt} />
          </div>
        )}
      </div>
    </div>
  );
}
