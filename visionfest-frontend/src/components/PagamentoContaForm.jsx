import React, { useEffect, useState } from "react";

export default function PagamentoContaForm({
  conta,
  onClose,
  onConfirm,
  disabled,
}) {
  const [formaPagamento, setFormaPagamento] = useState("");
  const [contaBancaria, setContaBancaria] = useState("");
  const [tipoCredito, setTipoCredito] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [valorPago, setValorPago] = useState(conta?.valorTotal || 0);
  const [novaDataVencimento, setNovaDataVencimento] = useState("");
  const [contasBancarias, setContasBancarias] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/contas-bancarias")
      .then((res) => res.json())
      .then(setContasBancarias)
      .catch((err) => console.error("Erro ao carregar contas bancárias:", err));
  }, []);

  useEffect(() => {
    if (formaPagamento === "dinheiro") {
      setContaBancaria("");
      setTipoCredito("");
      setParcelas(1);
    }

    if (formaPagamento !== "credito") {
      setTipoCredito("");
      setParcelas(1);
    }

    if (formaPagamento !== "pix" && formaPagamento !== "debito") {
      setContaBancaria("");
    }
  }, [formaPagamento, conta]);

  const handleSubmit = () => {
    if (!formaPagamento) return alert("Selecione a forma de pagamento.");
    if (
      (formaPagamento === "pix" || formaPagamento === "debito") &&
      !contaBancaria
    )
      return alert("Selecione a conta bancária.");
    if (formaPagamento === "credito") {
      if (!tipoCredito) return alert("Selecione o tipo de crédito.");
      if (tipoCredito === "parcelado" && (!parcelas || parseInt(parcelas) < 1))
        return alert("Informe a quantidade de parcelas.");
    }

    const valorPagoNum = parseFloat(valorPago);
    const valorTotalNum = parseFloat(conta.valorTotal);

    if (valorPagoNum < valorTotalNum && !novaDataVencimento) {
      return alert("Informe a nova data de vencimento para o valor restante.");
    }

    const contaSelecionadaObj = contasBancarias.find(
      (cb) => cb.id === parseInt(contaBancaria)
    );

    const dadosPagamento = {
      dataPagamento: new Date().toISOString(),
      formaPagamento,
      contaBancaria:
        formaPagamento === "pix" || formaPagamento === "debito"
          ? contaSelecionadaObj || null
          : null,
      tipoCredito: formaPagamento === "credito" ? tipoCredito : null,
      parcelas:
        formaPagamento === "credito" && tipoCredito === "parcelado"
          ? parcelas
          : null,
      valorPago: valorPagoNum,
      novaDataVencimento:
        valorPagoNum < valorTotalNum ? novaDataVencimento : null,
    };

    onConfirm && onConfirm(dadosPagamento);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-[#7ED957]">Baixar Conta</h2>

        {/* Informações da conta */}
        <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm space-y-1 border">
          <div>
            <strong>Descrição:</strong> {conta?.descricao}
          </div>
          <div>
            <strong>Centro de Custo:</strong>{" "}
            {conta?.centroCusto?.descricao || "-"}
          </div>
          <div>
            <strong>Vencimento:</strong>{" "}
            {new Date(conta?.vencimento).toLocaleDateString()}
          </div>
          <div>
            <strong>Valor Total:</strong> R${" "}
            {parseFloat(conta?.valorTotal).toFixed(2)}
          </div>
          <div>
            <strong>Status:</strong> {conta?.status}
          </div>
        </div>

        {/* Formulário */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1">
              Forma de Pagamento
            </label>
            <select
              className="select select-bordered w-full"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              disabled={disabled}
            >
              <option value="">Selecione</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          {(formaPagamento === "pix" || formaPagamento === "debito") && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                Conta Bancária
              </label>
              <select
                className="select select-bordered w-full"
                value={contaBancaria}
                onChange={(e) => setContaBancaria(e.target.value)}
                disabled={disabled}
              >
                <option value="">Selecione</option>
                {contasBancarias.map((cb) => (
                  <option key={cb.id} value={cb.id}>
                    {cb.banco} - Ag. {cb.agencia} / Cc. {cb.conta}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formaPagamento === "credito" && (
            <>
              <div>
                <label className="text-sm font-semibold block mb-1">
                  Tipo de Crédito
                </label>
                <select
                  className="select select-bordered w-full"
                  value={tipoCredito}
                  onChange={(e) => setTipoCredito(e.target.value)}
                  disabled={disabled}
                >
                  <option value="">Selecione</option>
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>
              {tipoCredito === "parcelado" && (
                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Parcelas
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered w-full"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-semibold block mb-1">
              Valor Pago
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              disabled={disabled || formaPagamento === "dinheiro"}
            />
          </div>

          {parseFloat(valorPago) < parseFloat(conta?.valorTotal) && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                Nova Data de Vencimento
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={novaDataVencimento}
                onChange={(e) => setNovaDataVencimento(e.target.value)}
                disabled={disabled}
              />
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#C0C0C0" }}
            onClick={onClose}
            disabled={disabled}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#7ED957" }}
            onClick={handleSubmit}
            disabled={disabled}
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
