import React, { useState, useEffect } from "react";
import api from "../../utils/api";

export default function ReceberForm({ conta, onClose, onBaixa }) {
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().slice(0, 10));
  const [formaPagamento, setFormaPagamento] = useState("");
  const [contaBancariaId, setContaBancariaId] = useState("");
  const [maquina, setMaquina] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [valorRecebido, setValorRecebido] = useState(conta?.valorTotal || 0);
  const [novaDataVencimento, setNovaDataVencimento] = useState("");
  const [contasBancarias, setContasBancarias] = useState([]);

  useEffect(() => {
    api.get("/contas-bancarias")
      .then(({ data }) => setContasBancarias(data))
      .catch(() => console.error("Erro ao carregar contas bancárias"));
  }, []);

  useEffect(() => {
    let valor = parseFloat(conta?.valorTotal || 0);
    setValorRecebido(valor.toFixed(2));
  }, [conta?.valorTotal]);

  const handleConfirmar = async () => {
    const recebido = parseFloat(valorRecebido);
    const total = parseFloat(conta.valorTotal || 0);

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
      parcelas: null, // removido, pois não vamos tratar parcelamento aqui
      valorRecebido: recebido,
      novaDataVencimento: recebido < total ? novaDataVencimento : null,
    };

    try {
      const { data } = await api.put(`/contas-receber/${conta.id}/receber`, payload);
      onBaixa(data);
      onClose();
    } catch (err) {
      alert("Erro ao confirmar recebimento: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-[#7ED957] mb-4">Receber Conta</h2>

        <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm border">
          <div><strong>{conta.descricao || "-"}</strong></div>
          <div>Vencimento: {new Date(conta.vencimento).toLocaleDateString()}</div>
          <div>Total: R$ {parseFloat(conta.valorTotal || 0).toFixed(2)}</div>
        </div>

        <label className="block mb-1">Data do Recebimento</label>
        <input
          type="date"
          className="input input-bordered w-full mb-3"
          value={dataRecebimento}
          onChange={(e) => setDataRecebimento(e.target.value)}
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
            />
          </>
        )}

        <label className="block mb-1">Valor Recebido</label>
        <input
          type="number"
          min="0"
          max={parseFloat(conta.valorTotal || 0)}
          className="input input-bordered w-full mb-3"
          value={valorRecebido}
          onChange={(e) => setValorRecebido(e.target.value)}
        />

        {parseFloat(valorRecebido) < parseFloat(conta.valorTotal || 0) && (
          <>
            <label className="block mb-1">Nova Data de Vencimento (Restante)</label>
            <input
              type="date"
              className="input input-bordered w-full mb-4"
              value={novaDataVencimento}
              onChange={(e) => setNovaDataVencimento(e.target.value)}
              required
            />
          </>
        )}

        <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
          <button className="btn bg-gray-300" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn bg-[#7ED957] text-white font-semibold"
            onClick={handleConfirmar}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
