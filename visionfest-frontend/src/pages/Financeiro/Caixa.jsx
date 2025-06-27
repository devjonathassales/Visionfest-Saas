import React, { useEffect, useState } from "react";

export default function Caixa() {
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [contasRecebidas, setContasRecebidas] = useState([]);
  const [contasPagas, setContasPagas] = useState([]);
  const [totais, setTotais] = useState({});
  const [loading, setLoading] = useState(true);

  const abrirCaixa = () => setCaixaAberto(true);
  const fecharCaixa = () => setCaixaAberto(false);

  const carregarDados = async () => {
    try {
      const recebidas = await fetch("http://localhost:5000/api/contas-receber")
        .then((r) => r.json());
      const pagas = await fetch("http://localhost:5000/api/contas-pagar")
        .then((r) => r.json());

      setContasRecebidas(recebidas.filter(c => c.status === "pago"));
      setContasPagas(pagas.filter(c => c.status === "pago"));

      const calcularTotais = (contas) =>
        contas.reduce((acc, conta) => {
          const forma = conta.formaPagamento || "outros";
          const valor = parseFloat(conta.valorPago || 0);
          acc[forma] = (acc[forma] || 0) + valor;
          return acc;
        }, {});

      const totaisRecebidos = calcularTotais(recebidas);
      const totaisPagos = calcularTotais(pagas);

      setTotais({
        recebidos: totaisRecebidos,
        pagos: totaisPagos,
      });

      if (!caixaAberto && (recebidas.length > 0 || pagas.length > 0)) {
        abrirCaixa();
      }

    } catch (e) {
      console.error("Erro ao carregar dados do caixa", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const renderTotais = (dados) =>
    Object.entries(dados).map(([forma, valor]) => (
      <div key={forma} className="flex justify-between">
        <span className="capitalize">{forma}:</span>
        <span>R$ {valor.toFixed(2)}</span>
      </div>
    ));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#7ED957] mb-4">Caixa</h1>

      <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-gray-700">
            Status do Caixa:{" "}
            <span className={caixaAberto ? "text-green-600" : "text-red-600"}>
              {caixaAberto ? "Aberto" : "Fechado"}
            </span>
          </span>

          <div className="space-x-2">
            <button
              className="px-4 py-2 bg-[#C0C0C0] text-black rounded-md font-semibold"
              onClick={abrirCaixa}
              disabled={caixaAberto}
            >
              Abrir Caixa
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold"
              onClick={fecharCaixa}
              disabled={!caixaAberto}
            >
              Fechar Caixa
            </button>
          </div>
        </div>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-[#7ED957] font-bold text-lg mb-2">
                Totais Recebidos
              </h2>
              <div className="bg-gray-50 p-4 rounded-md border">
                {renderTotais(totais.recebidos || {})}
              </div>
            </div>
            <div>
              <h2 className="text-[#7ED957] font-bold text-lg mb-2">
                Totais Pagos
              </h2>
              <div className="bg-gray-50 p-4 rounded-md border">
                {renderTotais(totais.pagos || {})}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listagem de movimentações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-[#7ED957] mb-2">
            Contas Recebidas
          </h2>
          <div className="overflow-auto max-h-96 border rounded-md">
            <table className="table-auto w-full text-sm">
              <thead className="bg-[#C0C0C0] text-left">
                <tr>
                  <th className="p-2">Cliente</th>
                  <th>Valor</th>
                  <th>Forma</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {contasRecebidas.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.cliente?.nome || "-"}</td>
                    <td>R$ {parseFloat(c.valorPago).toFixed(2)}</td>
                    <td>{c.formaPagamento}</td>
                    <td>{new Date(c.dataRecebimento).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#7ED957] mb-2">
            Contas Pagas
          </h2>
          <div className="overflow-auto max-h-96 border rounded-md">
            <table className="table-auto w-full text-sm">
              <thead className="bg-[#C0C0C0] text-left">
                <tr>
                  <th className="p-2">Fornecedor</th>
                  <th>Valor</th>
                  <th>Forma</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {contasPagas.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.fornecedor?.nome || "-"}</td>
                    <td>R$ {parseFloat(c.valorPago).toFixed(2)}</td>
                    <td>{c.formaPagamento}</td>
                    <td>{new Date(c.dataPagamento).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
