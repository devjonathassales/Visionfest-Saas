import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

export default function ContratoPage() {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function fetchContrato() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/cliente/contrato`);
        if (!res.ok) throw new Error("Erro ao carregar contrato");
        const data = await res.json();
        setContrato(data);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContrato();
  }, []);

  if (loading) return <p>Carregando contrato...</p>;
  if (erro) return <p className="text-red-600">Erro: {erro}</p>;
  if (!contrato) return <p>Nenhum contrato encontrado.</p>;

  const {
    plano,
    valor,
    funcionalidades,
    dataInicio,
    dataValidade,
    renovacaoAutomatica,
  } = contrato;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow font-open">
      <h1 className="text-3xl font-semibold text-[#7ED957] mb-4 font-montserrat">Detalhes do Contrato</h1>

      <div className="mb-4">
        <strong>Plano:</strong> {plano}
      </div>

      <div className="mb-4">
        <strong>Valor:</strong> R$ {valor.toFixed(2)}
      </div>

      <div className="mb-4">
        <strong>Funcionalidades:</strong>
        <ul className="list-disc ml-6 mt-1">
          {funcionalidades.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <strong>Início do Contrato:</strong> {formatDate(dataInicio)}
      </div>

      <div className="mb-4">
        <strong>Validade:</strong> {formatDate(dataValidade)}
      </div>

      <div>
        <strong>Renovação Automática:</strong> {renovacaoAutomatica ? "Sim" : "Não"}
      </div>
    </div>
  );
}
