import React, { useState, useEffect } from "react";

export default function ReceberForm({onClose, onBaixa }) {
  const [dataRecebimento, setDataRecebimento] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [contaBancaria, setContaBancaria] = useState("");
  const [cartao, setCartao] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [contasBancarias, setContasBancarias] = useState([]);

  // Aqui você deve puxar as contas bancárias cadastradas (mock ou fetch)
  useEffect(() => {
    // Mock exemplo
    setContasBancarias([
      { id: "1", nome: "Banco do Brasil - 1234" },
      { id: "2", nome: "Caixa - 5678" },
    ]);
  }, []);

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleConfirmar = () => {
    const dadosBaixa = {
      dataRecebimento,
      formaPagamento,
      contaBancaria: formaPagamento === "pix" || formaPagamento === "debito" ? contaBancaria : null,
      cartao: formaPagamento === "credito" ? cartao : null,
      parcelas: formaPagamento === "credito" ? parcelas : null,
    };
    onBaixa(dadosBaixa);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Receber Conta</h2>

        <label className="block mb-2">
          Data do Recebimento
          <input
            type="date"
            className="input input-bordered w-full"
            value={dataRecebimento}
            onChange={(e) => setDataRecebimento(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          Forma de Pagamento
          <select
            className="select select-bordered w-full"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
        </label>

        {(formaPagamento === "pix" || formaPagamento === "debito") && (
          <label className="block mb-2">
            Conta Bancária
            <select
              className="select select-bordered w-full"
              value={contaBancaria}
              onChange={(e) => setContaBancaria(e.target.value)}
            >
              <option value="">Selecione uma conta</option>
              {contasBancarias.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        {formaPagamento === "credito" && (
          <>
            <label className="block mb-2">
              Cartão
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Informe o cartão"
                value={cartao}
                onChange={(e) => setCartao(e.target.value)}
              />
            </label>
            <label className="block mb-2">
              Número de Parcelas
              <input
                type="number"
                min={1}
                className="input input-bordered w-full"
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
              />
            </label>
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-success" onClick={handleConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
