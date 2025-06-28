import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

export default function FaturasPage() {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function fetchFaturas() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/cliente/faturas`);
        if (!res.ok) throw new Error("Erro ao carregar faturas");
        const data = await res.json();
        setFaturas(data);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFaturas();
  }, []);

  if (loading) return <p>Carregando faturas...</p>;
  if (erro) return <p className="text-red-600">Erro: {erro}</p>;
  if (faturas.length === 0) return <p>Você não possui faturas pendentes.</p>;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow font-open">
      <h1 className="text-3xl font-semibold text-[#7ED957] mb-6 font-montserrat">Minhas Faturas</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#7ED957] text-white">
            <th className="p-3 text-left">Número</th>
            <th className="p-3 text-left">Vencimento</th>
            <th className="p-3 text-left">Valor</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Ação</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((fatura) => {
            const statusClasses = {
              pago: "text-green-600",
              pendente: "text-yellow-600",
              atrasado: "text-red-600",
            };
            return (
              <tr key={fatura.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">{fatura.numero}</td>
                <td className="p-3">{formatDate(fatura.vencimento)}</td>
                <td className="p-3">R$ {fatura.valor.toFixed(2)}</td>
                <td className={`p-3 font-semibold ${statusClasses[fatura.status] || ""}`}>
                  {fatura.status.charAt(0).toUpperCase() + fatura.status.slice(1)}
                </td>
                <td className="p-3">
                  {fatura.status === "pendente" && (
                    <button
                      className="bg-[#7ED957] hover:bg-green-600 text-white px-4 py-1 rounded"
                      onClick={() => alert("Em breve o pagamento estará disponível.")}
                    >
                      Pagar
                    </button>
                  )}
                  {(fatura.status === "pago" || fatura.status === "atrasado") && (
                    <span className="text-gray-500 italic">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
