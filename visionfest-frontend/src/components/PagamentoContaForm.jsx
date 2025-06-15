import React, { useEffect, useState } from "react";

export default function PagamentoContaForm({ conta, onClose, onConfirm }) {
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formaPagamento, setFormaPagamento] = useState("");

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleConfirmar = () => {
    if (!formaPagamento) {
      alert("Selecione a forma de pagamento");
      return;
    }
    onConfirm({
      dataPagamento,
      formaPagamento,
      // outros dados podem ser adicionados aqui
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Pagar Conta: {conta.descricao}</h2>

        <div className="grid gap-3">
          <label>
            Data do pagamento:
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </label>

          <label>
            Forma de pagamento:
            <select
              className="border p-2 rounded w-full"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>
          </label>

          {/* Adicione campos extras aqui conforme necessidade */}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
