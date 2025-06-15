import React, { useEffect, useState } from "react";

export default function ContaReceberForm({ onClose, setContas }) {
  const [descricao, setDescricao] = useState("");
  const [centroReceita, setCentroReceita] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [valorTotal, setValorTotal] = useState("");

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Cálculo automático do valor total
  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const d = parseFloat(desconto) || 0;
    let total = v;

    if (tipoDesconto === "percentual") {
      total = v - (v * d) / 100;
    } else {
      total = v - d;
    }

    setValorTotal(total >= 0 ? total.toFixed(2) : "0.00");
  }, [valor, desconto, tipoDesconto]);

  const handleSalvar = () => {
    const novaConta = {
      id: Date.now(),
      descricao,
      centroReceita,
      vencimento,
      pagamento,
      valor,
      desconto,
      tipoDesconto,
      valorTotal,
      status: "aberto",
    };
    setContas((prev) => [...prev, novaConta]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">Nova Conta a Receber</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Descrição"
            className="input input-bordered w-full"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <input
            type="text"
            placeholder="Centro de receita"
            className="input input-bordered w-full"
            value={centroReceita}
            onChange={(e) => setCentroReceita(e.target.value)}
          />
          <input
            type="date"
            placeholder="Vencimento"
            className="input input-bordered w-full"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
          <input
            type="date"
            placeholder="Data de pagamento"
            className="input input-bordered w-full"
            value={pagamento}
            onChange={(e) => setPagamento(e.target.value)}
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            className="input input-bordered w-full"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="select select-bordered w-1/2"
              value={tipoDesconto}
              onChange={(e) => setTipoDesconto(e.target.value)}
            >
              <option value="valor">Desconto (R$)</option>
              <option value="percentual">Desconto (%)</option>
            </select>
            <input
              type="number"
              placeholder="Desconto"
              className="input input-bordered w-1/2"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
          </div>
          <input
            type="text"
            placeholder="Valor Total"
            className="input input-bordered w-full"
            value={`R$ ${valorTotal}`}
            disabled
          />
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-success" onClick={handleSalvar}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
