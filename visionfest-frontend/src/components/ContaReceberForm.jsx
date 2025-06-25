import React, { useEffect, useState } from "react";
import ReceberForm from "./ReceberForm";

export default function ContaReceberForm({ onClose, onSave }) {
  const [descricao, setDescricao] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [centros, setCentros] = useState([]);
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [valorTotal, setValorTotal] = useState("0.00");

  const [mostrarReceber, setMostrarReceber] = useState(false);
  const [contaCriada, setContaCriada] = useState(null);

  useEffect(() => {
    const fetchCentros = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/centrocusto");
        const data = await res.json();
        const receitas = data.filter(c => c.tipo === "Receita" || c.tipo === "Ambos");
        setCentros(receitas);
      } catch (err) {
        console.error("Erro ao carregar centros de receita:", err);
      }
    };
    fetchCentros();
  }, []);

  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const d = parseFloat(desconto) || 0;
    const total = tipoDesconto === "percentual" ? v - (v * d) / 100 : v - d;
    setValorTotal(total >= 0 ? total.toFixed(2) : "0.00");
  }, [valor, desconto, tipoDesconto]);

  const limparCampos = () => {
    setDescricao("");
    setCentroCustoId("");
    setVencimento("");
    setValor("");
    setDesconto("");
    setTipoDesconto("valor");
    setValorTotal("0.00");
  };

  const payloadConta = () => ({
    descricao,
    centroCustoId,
    vencimento,
    valor: parseFloat(valor),
    desconto: parseFloat(desconto),
    tipoDesconto,
    valorTotal: parseFloat(valorTotal),
    status: "aberto",
  });

  const handleSalvar = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/contas-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadConta()),
      });

      const novaConta = await res.json();
      onSave?.(novaConta);
      limparCampos();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar conta:", err);
    }
  };

  const handleSalvarEReceber = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/contas-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadConta()),
      });

      const novaConta = await res.json();
      setContaCriada(novaConta);
      setMostrarReceber(true);
    } catch (err) {
      console.error("Erro ao salvar e receber:", err);
    }
  };

  const handleBaixa = async (dadosBaixa) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/contas-receber/${contaCriada.id}/receber`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosBaixa),
        }
      );

      const contaAtualizada = await res.json();
      onSave?.(contaAtualizada);
      setMostrarReceber(false);
      onClose();
    } catch (err) {
      console.error("Erro ao realizar baixa:", err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-md w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-[#7ED957]">
            Nova Conta a Receber
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="">Centro de Receita</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.descricao}
                </option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Vencimento"
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

          <div className="flex justify-end mt-6 gap-2 flex-wrap">
            <button className="btn bg-[#c0c0c0] hover:bg-green-600 text-black px-4 py-2 rounded flex items-center gap-2" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-success bg-[#7ed957] hover:bg-green-600 text-black px-4 py-2 rounded flex items-center gap-2" onClick={handleSalvar}>
              Salvar
            </button>
            <button className="btn btn-primary bg-green-700 hover:bg-green-600 text-black px-4 py-2 rounded flex items-center gap-2" onClick={handleSalvarEReceber}>
              Salvar e Receber
            </button>
          </div>
        </div>
      </div>

      {mostrarReceber && contaCriada && (
        <ReceberForm
          conta={contaCriada}
          onClose={() => setMostrarReceber(false)}
          onBaixa={handleBaixa}
        />
      )}
    </>
  );
}
