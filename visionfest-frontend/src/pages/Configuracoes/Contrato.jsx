import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function ContratoPage() {
  const { apiCliente } = useAuth();
  const [contrato, setContrato] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [{ data: atual }, { data: hist }, { data: planosDisp }] =
        await Promise.all([
          apiCliente.get("/contrato"),
          apiCliente.get("/contrato/historico"),
          apiCliente.get("/contrato/planos"),
        ]);
      setContrato(atual);
      setHistorico(hist || []);
      setPlanos(planosDisp || []);
    } catch (e) {
      setErro(e?.response?.data?.error || "Erro ao carregar contrato");
      setContrato(null);
      setHistorico([]);
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  const formatMoney = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const toggleRenovacao = async () => {
    try {
      const { data } = await apiCliente.patch("/contrato/renovacao", {
        renovacaoAutomatica: !contrato.renovacaoAutomatica,
      });
      setContrato((c) => ({
        ...c,
        renovacaoAutomatica: !!data.renovacaoAutomatica,
      }));
      alert("Preferência de renovação atualizada.");
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao atualizar renovação.");
    }
  };

  const renovarAgora = async () => {
    if (!confirm("Confirmar renovação por mais 12 meses?")) return;
    try {
      const { data } = await apiCliente.post("/contrato/renovar");
      setContrato((c) => ({
        ...c,
        dataValidade: data.dataValidade,
        renovacaoAutomatica: !!data.renovacaoAutomatica,
      }));
      alert("Renovação realizada com sucesso.");
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao renovar agora.");
    }
  };

  const solicitarUpgrade = async (planoId) => {
    if (!planoId) return;
    if (!confirm("Confirmar solicitação de upgrade deste plano?")) return;
    try {
      const { data } = await apiCliente.post("/contrato/upgrade", { planoId });
      alert(data?.message || "Upgrade solicitado.");
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao solicitar upgrade.");
    }
  };

  const solicitarCancelamento = async () => {
    const msgRegras =
      "Atenção:\n" +
      "- Não é possível realizar downgrade.\n" +
      "- Cancelamento recorrente (cartão): solicitar com 30 dias de antecedência da próxima parcela.\n" +
      "- Cancelamento via pix/boleto: solicitar com 15 dias de antecedência do vencimento.\n" +
      "- Multa: 2 mensalidades se uso < 6 meses; 1 mensalidade após 6 meses.";
    if (!confirm(`${msgRegras}\n\nDeseja prosseguir com o cancelamento?`))
      return;

    const motivo = prompt("Opcional: descreva o motivo do cancelamento", "");
    try {
      const { data } = await apiCliente.post("/contrato/cancelar", { motivo });
      alert(
        (data?.message || "Solicitação de cancelamento registrada.") +
          (data?.valorMulta
            ? `\nValor estimado de multa: ${formatMoney(data.valorMulta)}`
            : "")
      );
      // Carrega de novo para refletir status cancelamento_pendente (se aplicável)
      carregar();
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao solicitar cancelamento.");
    }
  };

  if (loading) return <p>Carregando contrato...</p>;
  if (erro) return <p className="text-red-600">Erro: {erro}</p>;
  if (!contrato) return <p>Nenhum contrato encontrado.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-open">
      <h1 className="text-3xl font-semibold text-[#7ED957] font-montserrat">
        Seu Plano
      </h1>

      {/* Card do plano atual */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-montserrat font-bold">
              {contrato.plano}
            </h2>
            <p className="text-3xl font-bold mt-2">
              {formatMoney(contrato.valor)}{" "}
              <span className="text-gray-500 text-base">/ mês</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Status: <b>{(contrato.status || "ativa").toUpperCase()}</b>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Upgrade (abre um seletor rápido) */}
            <div className="relative">
              <details className="group">
                <summary className="cursor-pointer bg-[#7ED957] hover:bg-green-600 text-white px-4 py-2 rounded">
                  Upgrade
                </summary>
                <div className="absolute z-10 mt-2 bg-white border rounded shadow min-w-[240px] p-2">
                  {planos.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Sem planos disponíveis.
                    </div>
                  )}
                  {planos.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                      onClick={() => solicitarUpgrade(p.id)}
                    >
                      <div className="font-semibold">
                        {p.nome} — {formatMoney(p.valor)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {Array.isArray(p.funcionalidades)
                          ? p.funcionalidades.join(", ")
                          : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Renovar agora */}
            <button
              onClick={renovarAgora}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
            >
              Renovar agora
            </button>

            {/* Auto-renovação ON/OFF */}
            <button
              onClick={toggleRenovacao}
              className={`px-4 py-2 rounded ${
                contrato.renovacaoAutomatica
                  ? "bg-green-100 border border-green-400"
                  : "bg-gray-100 border border-gray-300"
              }`}
              title="Ligar/Desligar renovação automática"
            >
              Auto-renovação:{" "}
              <b>{contrato.renovacaoAutomatica ? "Ativa" : "Desativada"}</b>
            </button>

            {/* Cancelar */}
            <button
              onClick={solicitarCancelamento}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              Cancelar plano
            </button>
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Funcionalidades</h3>
          <ul className="list-disc ml-6 text-sm">
            {(contrato.funcionalidades || []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Datas */}
        <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Início:</span>{" "}
            <b>{formatDate(contrato.dataInicio)}</b>
          </div>
          <div>
            <span className="text-gray-500">Validade:</span>{" "}
            <b>{formatDate(contrato.dataValidade)}</b>
          </div>
          <div>
            <span className="text-gray-500">Pagamento:</span>{" "}
            <b>{(contrato.metodoPagamento || "pix").toUpperCase()}</b>
          </div>
        </div>
      </div>

      {/* Observações / Regras */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm leading-relaxed">
        <b>Observações:</b>
        <ul className="list-disc ml-5 mt-2">
          <li>
            Não é possível realizar <b>downgrade</b> de planos.
          </li>
          <li>
            Cancelamento <b>recorrente (cartão)</b>: solicitar com{" "}
            <b>30 dias</b> de antecedência da próxima parcela.
          </li>
          <li>
            Cancelamento via <b>PIX/Boleto</b>: solicitar com <b>15 dias</b> de
            antecedência do vencimento.
          </li>
          <li>
            <b>Multa</b> de cancelamento: <b>2 mensalidades</b> se uso &lt; 6
            meses; <b>1 mensalidade</b> após 6 meses.
          </li>
        </ul>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4 font-montserrat text-[#C0C0C0]">
          Histórico de Planos
        </h3>
        {historico.length === 0 ? (
          <p className="text-gray-500">Nenhum histórico disponível.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Plano</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Início</th>
                  <th className="py-2">Fim</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{h.plano}</td>
                    <td className="py-2">{formatMoney(h.valor)}</td>
                    <td className="py-2">{formatDate(h.dataInicio)}</td>
                    <td className="py-2">{formatDate(h.dataFim)}</td>
                    <td className="py-2">{(h.status || "").toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
