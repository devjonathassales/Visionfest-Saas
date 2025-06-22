// ContasPagarForm.jsx
import React, { useEffect, useState } from "react";

export default function ContasPagarForm({ onClose, onSave, onPagar }) {
  const [descricao, setDescricao] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [valorTotal, setValorTotal] = useState("0.00");

  const [centros, setCentros] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/centrocusto")
      .then(res => res.json())
      .then(data => {
        const somenteCustos = data.filter(c => c.tipo === "Custo" || c.tipo === "Ambos");
        setCentros(somenteCustos);
      })
      .catch(err => console.error("Erro ao carregar centros:", err));
  }, []);

  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const d = parseFloat(desconto) || 0;
    const total = tipoDesconto === "percentual" ? v - (v * d) / 100 : v - d;
    setValorTotal(total >= 0 ? total.toFixed(2) : "0.00");
  }, [valor, desconto, tipoDesconto]);

  const construirPayload = () => ({
    descricao,
    centroCustoId,
    vencimento,
    valor: parseFloat(valor),
    desconto: parseFloat(desconto),
    tipoDesconto,
    valorTotal: parseFloat(valorTotal),
  });

  const handleSalvar = async () => {
    try {
      const novaConta = construirPayload();
      const response = await fetch("http://localhost:5000/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaConta),
      });

      const data = await response.json();
      onSave && onSave(data); // Atualiza lista
      onClose(); // Fecha modal
    } catch (err) {
      console.error("Erro ao salvar conta:", err);
    }
  };

  const handleSalvarEPagar = async () => {
    try {
      const novaConta = construirPayload();
      const response = await fetch("http://localhost:5000/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaConta),
      });

      const data = await response.json();
      onSave && onSave(data);
      onPagar && onPagar(data); // Abre o form de pagamento
    } catch (err) {
      console.error("Erro ao salvar e pagar:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4 text-[#7ED957]">Nova Conta a Pagar</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Descrição"
            className="input input-bordered w-full"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <select
            className="select select-bordered w-full"
            value={centroCustoId}
            onChange={(e) => setCentroCustoId(e.target.value)}
          >
            <option value="">Centro de Custo</option>
            {centros.map(c => (
              <option key={c.id} value={c.id}>{c.descricao}</option>
            ))}
          </select>
          <input
            type="date"
            className="input input-bordered w-full"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
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
          <button
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#C0C0C0" }}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#084C61" }}
            onClick={handleSalvarEPagar}
          >
            Salvar e Pagar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#7ED957" }}
            onClick={handleSalvar}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
