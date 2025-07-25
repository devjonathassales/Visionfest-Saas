import React, { useState, useEffect } from "react";
import api from "../../utils/api";

export default function ReceberForm({ conta, empresa, onClose, onBaixa }) {
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [formaPagamento, setFormaPagamento] = useState("");
  const [contaBancariaId, setContaBancariaId] = useState("");
  const [maquina, setMaquina] = useState("");
  const [valorRecebido, setValorRecebido] = useState(0);
  const [novaDataVencimento, setNovaDataVencimento] = useState("");
  const [contasBancarias, setContasBancarias] = useState([]);
  const [currentConta, setCurrentConta] = useState(conta || null);
  const [loading, setLoading] = useState(false);

  // Buscar contas bancárias no carregamento
  useEffect(() => {
    api
      .get("/contas-bancarias")
      .then(({ data }) => setContasBancarias(data))
      .catch(() => console.error("Erro ao carregar contas bancárias"));
  }, []);

  // Se empresa foi passada mas conta não, buscar conta pendente da empresa
  useEffect(() => {
    async function buscarContaPorEmpresa() {
      if (empresa && !conta) {
        try {
          const res = await api.get(`/empresas/${empresa.id}/contas-receber`);
          const pendente = res.data.find((c) => c.status === "aberto" || c.status === "pendente");
          if (pendente) {
            setCurrentConta(pendente);
            setValorRecebido(parseFloat(pendente.valorTotal).toFixed(2));
          } else {
            alert("Nenhuma conta pendente para esta empresa.");
            onClose();
          }
        } catch (err) {
          console.error("Erro ao buscar contas da empresa", err);
          alert("Erro ao buscar contas da empresa.");
          onClose();
        }
      }
    }
    buscarContaPorEmpresa();
  }, [empresa, conta, onClose]);

  // Quando a prop conta muda, atualiza estado
  useEffect(() => {
    if (conta) {
      setCurrentConta(conta);
      setValorRecebido(parseFloat(conta.valorTotal || 0).toFixed(2));
    }
  }, [conta]);

  const handleConfirmar = async () => {
    if (!currentConta) return;

    const recebido = parseFloat(valorRecebido);
    const total = parseFloat(currentConta.valorTotal || 0);

    if (!formaPagamento) {
      alert("Selecione a forma de pagamento.");
      return;
    }

    if (["pix", "transferencia"].includes(formaPagamento) && !contaBancariaId) {
      alert("Selecione a conta bancária.");
      return;
    }

    if (recebido < total && !novaDataVencimento) {
      alert("Informe a nova data de vencimento para o valor restante.");
      return;
    }

    const payload = {
      dataRecebimento,
      formaPagamento,
      contaBancariaId: ["pix", "transferencia"].includes(formaPagamento)
        ? Number(contaBancariaId)
        : null,
      maquina: ["debito", "credito"].includes(formaPagamento) ? maquina : null,
      valorRecebido: recebido,
      novaDataVencimento: recebido < total ? novaDataVencimento : null,
    };

    try {
      setLoading(true);
      const { data } = await api.put(
        `/contas-receber/${currentConta.id}/receber`,
        payload
      );
      if (onBaixa) onBaixa(data);
      onClose();
    } catch (err) {
      console.error("Erro ao confirmar recebimento", err);
      alert("Erro ao confirmar recebimento.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentConta) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Nenhuma conta disponível para receber.</p>
        <button className="btn mt-3 bg-gray-300" onClick={onClose}>
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-[#7ED957] mb-4">Receber Conta</h2>

        {empresa && (
          <div className="bg-green-50 p-3 rounded-md mb-3 border border-green-200">
            <div className="text-green-800 font-semibold">{empresa.nome}</div>
            <div className="text-green-600 text-sm">{empresa.dominio}</div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm border">
          <div>
            <strong>{currentConta.descricao || "-"}</strong>
          </div>
          <div>
            Vencimento: {new Date(currentConta.vencimento).toLocaleDateString()}
          </div>
          <div>
            Total: R$ {parseFloat(currentConta.valorTotal || 0).toFixed(2)}
          </div>
        </div>

        <label className="block mb-1">Data do Recebimento</label>
        <input
          type="date"
          className="input input-bordered w-full mb-3"
          value={dataRecebimento}
          onChange={(e) => setDataRecebimento(e.target.value)}
          disabled={loading}
        />

        <label className="block mb-1">Forma de Pagamento</label>
        <select
          className="select select-bordered w-full mb-3"
          value={formaPagamento}
          onChange={(e) => {
            setFormaPagamento(e.target.value);
            setContaBancariaId("");
            setMaquina("");
          }}
          disabled={loading}
        >
          <option value="">Selecione</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="transferencia">Transferência</option>
        </select>

        {["pix", "transferencia"].includes(formaPagamento) && (
          <>
            <label className="block mb-1">Conta Bancária</label>
            <select
              className="select select-bordered w-full mb-3"
              value={contaBancariaId}
              onChange={(e) => setContaBancariaId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione</option>
              {contasBancarias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.banco} - Ag. {c.agencia} / Cc. {c.conta}
                </option>
              ))}
            </select>
          </>
        )}

        {["debito", "credito"].includes(formaPagamento) && (
          <>
            <label className="block mb-1">Máquina</label>
            <input
              type="text"
              className="input input-bordered w-full mb-3"
              value={maquina}
              onChange={(e) => setMaquina(e.target.value)}
              placeholder="Nome da máquina"
              disabled={loading}
            />
          </>
        )}

        <label className="block mb-1">Valor Recebido</label>
        <input
          type="number"
          min="0"
          max={parseFloat(currentConta.valorTotal || 0)}
          className="input input-bordered w-full mb-3"
          value={valorRecebido}
          onChange={(e) => setValorRecebido(e.target.value)}
          disabled={loading}
        />

        {parseFloat(valorRecebido) <
          parseFloat(currentConta.valorTotal || 0) && (
          <>
            <label className="block mb-1">
              Nova Data de Vencimento (Restante)
            </label>
            <input
              type="date"
              className="input input-bordered w-full mb-4"
              value={novaDataVencimento}
              onChange={(e) => setNovaDataVencimento(e.target.value)}
              required
              disabled={loading}
            />
          </>
        )}

        <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
          <button
            className="btn bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn bg-[#7ED957] text-white font-semibold"
            onClick={handleConfirmar}
            disabled={loading}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
