import React, { useState, useEffect } from "react";
const API_URL = "http://localhost:5000/api";

export default function ReceberForm({ conta, onClose, onBaixa }) {
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().slice(0, 10));
  const [formaPagamento, setFormaPagamento] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [maquina, setMaquina] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [tipoCredito, setTipoCredito] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [taxaRepassada, setTaxaRepassada] = useState(false);
  const [valorRecebido, setValorRecebido] = useState(conta?.valorTotal || 0);
  const [novaDataVencimento, setNovaDataVencimento] = useState("");
  const [contasBancarias, setContasBancarias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      const [resContas, resCartoes] = await Promise.all([
        fetch(`${API_URL}/contas-bancarias`),
        fetch(`${API_URL}/cartoes-credito`)
      ]);
      setContasBancarias(await resContas.json());
      setCartoes(await resCartoes.json());
    };
    carregarDados();
  }, []);

  useEffect(() => {
    let valor = parseFloat(conta?.valorTotal || 0);
    if (["credito", "debito"].includes(formaPagamento) && cartaoId) {
      const cartao = cartoes.find((c) => c.id === Number(cartaoId));
      if (cartao && !taxaRepassada) {
        let taxa = 0;
        if (formaPagamento === "credito") {
          taxa = tipoCredito === "parcelado" ? cartao.taxaParcelado || 0 : cartao.taxaVista || 0;
        } else if (formaPagamento === "debito") {
          taxa = cartao.taxaDebito || 0;
        }
        valor = valor * (1 - taxa / 100);
      }
    }
    setValorRecebido(valor.toFixed(2));
  }, [
    formaPagamento,
    cartaoId,
    taxaRepassada,
    tipoCredito,
    cartoes,
    conta?.valorTotal,
  ]);

  const handleConfirmar = async () => {
    const recebido = parseFloat(valorRecebido);
    const total = parseFloat(conta.valorTotal || 0);

    // Validações obrigatórias
    if (!formaPagamento) {
      alert("Selecione a forma de pagamento.");
      return;
    }

    if (["pix", "transferencia"].includes(formaPagamento) && !contaBancaria) {
      alert("Selecione a conta bancária.");
      return;
    }

    if (["credito", "debito"].includes(formaPagamento) && !cartaoId) {
      alert("Selecione o cartão.");
      return;
    }

    if (formaPagamento === "credito" && !tipoCredito) {
      alert("Selecione o tipo de crédito.");
      return;
    }

    if (formaPagamento === "credito" && tipoCredito === "parcelado" && parcelas < 1) {
      alert("Informe a quantidade de parcelas.");
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
        ? Number(contaBancaria) || null
        : null,
      maquina: ["debito", "credito"].includes(formaPagamento) ? maquina : null,
      cartaoId: ["credito", "debito"].includes(formaPagamento)
        ? Number(cartaoId)
        : null,
      tipoCredito: formaPagamento === "credito" ? tipoCredito : null,
      parcelas:
        formaPagamento === "credito" && tipoCredito === "parcelado"
          ? parcelas
          : null,
      taxaRepassada,
      valorRecebido: recebido,
      novaDataVencimento: recebido < total ? novaDataVencimento : null,
    };

    try {
      const res = await fetch(`${API_URL}/contas-receber/${conta.id}/receber`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao receber");
      const data = await res.json();
      onBaixa(data);
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md max-h-screen overflow-y-auto">
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
            setCartaoId("");
            setTipoCredito("");
            setParcelas(1);
            setTaxaRepassada(false);
            setMaquina("");
            setContaBancaria("");
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
              value={contaBancaria}
              onChange={(e) => setContaBancaria(e.target.value)}
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
            <label className="block mb-1">Máquina / Cartão</label>
            <select
              className="select select-bordered w-full mb-2"
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
            >
              <option value="">Selecione</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.banco} – Débito: {c.taxaDebito ?? 0}% / Crédito:{" "}
                  {c.taxaVista ?? 0}% à vista, {c.taxaParcelado ?? 0}% parcelado
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={taxaRepassada}
                onChange={(e) => setTaxaRepassada(e.target.checked)}
              />
              Taxa repassada ao cliente?
            </label>
          </>
        )}

        {formaPagamento === "credito" && (
          <>
            <label className="block mb-1">Tipo de Crédito</label>
            <select
              className="select select-bordered w-full mb-2"
              value={tipoCredito}
              onChange={(e) => setTipoCredito(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>

            {tipoCredito === "parcelado" && (
              <>
                <label className="block mb-1">Parcelas</label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full mb-3"
                  value={parcelas}
                  onChange={(e) => setParcelas(Number(e.target.value))}
                />
              </>
            )}
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
