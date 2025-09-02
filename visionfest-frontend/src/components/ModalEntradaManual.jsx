import React, { useState } from "react";

export default function ModalEntradaManual({
  isOpen,
  onClose,
  onSalvar /*, contasBancarias*/,
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");

  const handleSalvar = () => {
    if (!descricao || !valor) {
      alert("Preencha todos os campos!");
      return;
    }

    onSalvar({
      descricao,
      valor: Number(valor) || 0,
      formaPagamento,
    });

    setDescricao("");
    setValor("");
    setFormaPagamento("dinheiro");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-[#7ED957]">Entrada Manual</h2>

        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <input
          type="number"
          className="w-full p-2 border rounded"
          placeholder="Valor (R$)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded"
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
          disabled
        >
          <option value="dinheiro">Dinheiro</option>
        </select>

        <div className="flex justify-end gap-2 pt-4">
          <button className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-[#7ED957] text-white font-bold"
            onClick={handleSalvar}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
