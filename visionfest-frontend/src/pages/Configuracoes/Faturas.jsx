import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaMoneyBillWave } from "react-icons/fa";

export default function FaturasPage() {
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);

  const planoAtual = {
    nome: "Plano Profissional",
    validade: "01/01/2026"
  };

  const faturas = [
    {
      id: "001",
      emissao: "01/06/2025",
      vencimento: "10/06/2025",
      valor: "R$ 199,00",
      status: "Aberta"
    },
    {
      id: "002",
      emissao: "01/05/2025",
      vencimento: "10/05/2025",
      valor: "R$ 199,00",
      status: "Paga"
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold text-[#7ED957] font-montserrat">Minhas Faturas</h1>

      {/* PLANO DO CLIENTE */}
      <div className="bg-white p-5 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold text-gray-700 font-montserrat">Plano Atual:</p>
          <p className="text-gray-800 font-open">{planoAtual.nome}</p>
          <p className="text-gray-500 font-open text-sm italic">Válido até {planoAtual.validade}</p>
        </div>
      </div>

      {/* LISTAGEM DE FATURAS */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-700 font-semibold text-left font-open">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Emissão</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 font-open">
            {faturas.map((fatura) => (
              <tr key={fatura.id}>
                <td className="px-4 py-3">{fatura.id}</td>
                <td className="px-4 py-3">{fatura.emissao}</td>
                <td className="px-4 py-3">{fatura.vencimento}</td>
                <td className="px-4 py-3">{fatura.valor}</td>
                <td className="px-4 py-3">
                  {fatura.status === "Paga" ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <FaCheckCircle /> Paga
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <FaTimesCircle /> Aberta
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {fatura.status === "Aberta" && (
                    <button
                      onClick={() => setFaturaSelecionada(fatura)}
                      className="bg-[#7ED957] hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold shadow font-open"
                    >
                      Pagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {faturaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setFaturaSelecionada(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimesCircle size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-montserrat">
              Pagamento da Fatura #{faturaSelecionada.id}
            </h2>

            <p className="text-gray-700 mb-3 font-open">
              <strong>Valor:</strong> {faturaSelecionada.valor}
            </p>
            <p className="text-gray-700 mb-6 font-open">
              <strong>Vencimento:</strong> {faturaSelecionada.vencimento}
            </p>

            <div className="space-y-3 font-open">
              <button className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-left flex items-center gap-2">
                <FaMoneyBillWave /> Baixar Boleto (PDF)
              </button>
              <button className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-left flex items-center gap-2">
                📱 Copiar Código PIX
              </button>
              <button className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-left flex items-center gap-2">
                💳 Pagar com Cartão de Crédito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
