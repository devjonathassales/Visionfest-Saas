import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function FaturasPage() {
  const { apiCliente } = useAuth();
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await apiCliente.get("/faturas");
        if (ativo) setFaturas(data || []);
      } catch (e) {
        if (ativo)
          setErro(e?.response?.data?.error || "Erro ao carregar faturas");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [apiCliente]);

  const pagar = async (faturaId) => {
    try {
      const { data } = await apiCliente.post(`/faturas/${faturaId}/pagar`);
      alert(data?.message || "Pagamento iniciado.");
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao iniciar pagamento.");
    }
  };

  if (loading) return <p>Carregando faturas...</p>;
  if (erro) return <p className="text-red-600">Erro: {erro}</p>;
  if (faturas.length === 0) return <p>Você não possui faturas.</p>;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const formatMoney = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClasses = {
    pago: "text-green-600",
    pendente: "text-yellow-600",
    atrasado: "text-red-600",
  };

  const statusPt = {
    pago: "Pago",
    pendente: "A vencer",
    atrasado: "Em atraso",
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow font-open">
      <h1 className="text-3xl font-semibold text-[#7ED957] mb-6 font-montserrat">
        Minhas Faturas
      </h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#7ED957] text-white">
            <th className="p-3 text-left">Parcela</th>
            <th className="p-3 text-left">Vencimento</th>
            <th className="p-3 text-left">Valor</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Ação</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((f) => (
            <tr
              key={f.id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="p-3">{f.numero}</td>
              <td className="p-3">{formatDate(f.vencimento)}</td>
              <td className="p-3">{formatMoney(f.valor)}</td>
              <td
                className={`p-3 font-semibold ${statusClasses[f.status] || ""}`}
              >
                {statusPt[f.status] || f.status}
              </td>
              <td className="p-3">
                {f.status === "pendente" || f.status === "atrasado" ? (
                  <button
                    className="bg-[#7ED957] hover:bg-green-600 text-white px-4 py-1 rounded"
                    onClick={() => pagar(f.id)}
                  >
                    Pagar
                  </button>
                ) : (
                  <span className="text-gray-500 italic">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dica de UX futura: mostrar instruções/linha digitável/2ª via quando pago/pendente */}
    </div>
  );
}
