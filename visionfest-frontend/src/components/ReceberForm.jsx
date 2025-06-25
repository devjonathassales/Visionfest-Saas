import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

export default function ReceberForm({ conta, onClose, onBaixa }) {
  const [dataRecebimento, setDataRecebimento] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [formaPagamento, setFormaPagamento] = useState("");
  const [tipoCredito, setTipoCredito] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [valorRecebido, setValorRecebido] = useState(conta?.valorTotal || 0);
  const [contaBancaria, setContaBancaria] = useState("");
  const [contasBancarias, setContasBancarias] = useState([]);

  useEffect(() => {
    const fetchContas = async () => {
      try {
        const res = await fetch(`${API_URL}/contas-bancarias`);
        if (!res.ok) throw new Error("Erro ao buscar contas bancárias");
        setContasBancarias(await res.json());
      } catch (err) {
        alert("Erro ao buscar contas bancárias: " + err.message);
      }
    };
    fetchContas();
  }, []);

  useEffect(() => {
    if (formaPagamento === "dinheiro") {
      setValorRecebido(conta?.valorTotal || 0);
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

  const handleConfirmar = async () => {
    try {
      const contaSelecionadaObj = contasBancarias.find(
        (cb) => cb.id === parseInt(contaBancaria)
      );

      const dados = {
        dataRecebimento,
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
        valorRecebido: parseFloat(valorRecebido),
      };

      const res = await fetch(`${API_URL}/contas-receber/${conta.id}/receber`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!res.ok) throw new Error("Erro ao receber conta");

      const dataAtualizada = await res.json();
      onBaixa(dataAtualizada);
      onClose();
    } catch (err) {
      alert("Erro ao receber: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#7ED957] mb-4">Receber Conta</h2>

        {/* Informações da conta */}
        <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm space-y-1 border">
          <div><strong>Descrição:</strong> {conta?.descricao}</div>
          <div><strong>Cliente:</strong> {conta?.cliente?.nome || "-"}</div>
          <div><strong>Vencimento:</strong> {new Date(conta?.vencimento).toLocaleDateString()}</div>
          <div><strong>Valor Total:</strong> R$ {parseFloat(conta?.valorTotal).toFixed(2)}</div>
          <div><strong>Status:</strong> {conta?.status}</div>
        </div>

        {/* Formulário */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Data de Recebimento</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">Forma de Pagamento</label>
            <select
              className="select select-bordered w-full"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
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
              <label className="text-sm font-semibold block mb-1">Conta Bancária</label>
              <select
                className="select select-bordered w-full"
                value={contaBancaria}
                onChange={(e) => setContaBancaria(e.target.value)}
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
                <label className="text-sm font-semibold block mb-1">Tipo de Crédito</label>
                <select
                  className="select select-bordered w-full"
                  value={tipoCredito}
                  onChange={(e) => setTipoCredito(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>

              {tipoCredito === "parcelado" && (
                <div>
                  <label className="text-sm font-semibold block mb-1">Parcelas</label>
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered w-full"
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-semibold block mb-1">Valor Recebido</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              disabled={formaPagamento === "dinheiro"}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-black bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#7ED957" }}
          >
            Confirmar Recebimento
          </button>
        </div>
      </div>
    </div>
  );
}
