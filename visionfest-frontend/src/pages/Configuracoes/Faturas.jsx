import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function Faturas() {
  const { apiCliente } = useAuth();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const { data } = await apiCliente.get("/faturas");
        setItens(data || []);
      } catch (e) {
        setErro(e?.response?.data?.error || "Erro ao carregar faturas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const moeda = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  const fmtData = (iso) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

  if (loading) return <p>Carregando faturas...</p>;
  if (erro) return <p className="text-red-600">{erro}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Faturas</h1>
      {itens.length === 0 ? (
        <p>Nenhuma fatura encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">#</th>
                <th className="py-2">Descrição</th>
                <th className="py-2">Vencimento</th>
                <th className="py-2">Valor</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{f.numero ?? "-"}</td>
                  <td className="py-2">{f.descricao}</td>
                  <td className="py-2">{fmtData(f.vencimento)}</td>
                  <td className="py-2">{moeda(f.valor)}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
                        f.status === "pago"
                          ? "bg-green-500"
                          : f.status === "aberto"
                          ? "bg-yellow-500 text-black"
                          : "bg-gray-500"
                      }`}
                    >
                      {String(f.status || "").toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
