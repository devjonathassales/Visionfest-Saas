import React, { useState, useEffect } from "react";

export default function ClienteVisualizar({ cliente, onClose }) {
  const [dadosCliente, setDadosCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!cliente?.id) {
      setDadosCliente(null);
      return;
    }

    setLoading(true);
    setErro(null);

    fetch(`http://localhost:5000/api/clientes/${cliente.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar dados do cliente");
        return res.json();
      })
      .then((data) => {
        setDadosCliente(data);
      })
      .catch((err) => {
        setErro(err.message);
      })
      .finally(() => setLoading(false));
  }, [cliente]);

  if (!cliente) return null;

  const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold">{value || "—"}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-montserrat text-primary">
          Detalhes do Cliente
        </h2>
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Fechar
        </button>
      </div>

      {loading && <p>Carregando dados do cliente...</p>}
      {erro && <p className="text-red-600">Erro: {erro}</p>}

      {!loading && !erro && dadosCliente && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm font-opensans">
          <InfoItem label="Nome" value={dadosCliente.nome} />
          <InfoItem label="CPF" value={dadosCliente.cpf} />
          <InfoItem label="Data de Nascimento" value={dadosCliente.dataNascimento} />
          <InfoItem label="WhatsApp" value={dadosCliente.whatsapp} />
          <InfoItem label="Celular" value={dadosCliente.celular} />
          <InfoItem label="Email" value={dadosCliente.email} />
          <InfoItem label="CEP" value={dadosCliente.cep} />
          <InfoItem label="Logradouro" value={dadosCliente.logradouro} />
          <InfoItem label="Número" value={dadosCliente.numero} />
          <InfoItem label="Complemento" value={dadosCliente.complemento} />
          <InfoItem label="Bairro" value={dadosCliente.bairro} />
          <InfoItem label="Cidade" value={dadosCliente.cidade} />
          <InfoItem label="Estado" value={dadosCliente.estado} />
        </div>
      )}
    </div>
  );
}
