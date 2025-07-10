import React, { useState, useEffect } from "react";

export default function ModalEntradaManual({ isOpen, onClose, onSalvar }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");

  useEffect(() => {
    if (!isOpen) {
      setDescricao("");
      setValor("");
      setFormaPagamento("dinheiro");
    }
  }, [isOpen]);

  const handleSalvar = () => {
    if (!descricao.trim() || !valor || Number(valor) <= 0) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    onSalvar({
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      formaPagamento,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalEntradaManualTitle"
    >
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
        <h2
          id="modalEntradaManualTitle"
          className="text-2xl font-bold text-[#7ED957]"
        >
          Entrada Manual
        </h2>

        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          autoFocus
        />

        <input
          type="number"
          min="0.01"
          step="0.01"
          className="w-full p-2 border rounded"
          placeholder="Valor (R$)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded cursor-not-allowed"
          value={formaPagamento}
          disabled
          aria-disabled="true"
        >
          <option value="dinheiro">Dinheiro</option>
        </select>

        <div className="flex justify-end gap-2 pt-4">
          <button
            className="px-4 py-2 rounded bg-gray-300"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-[#7ED957] text-white font-bold"
            onClick={handleSalvar}
            type="button"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
