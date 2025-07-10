import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function ContaReceberForm({ onClose, onSave, onPagar }) {
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clientes, setClientes] = useState([]);
  const [centroCustoId, setCentroCustoId] = useState("");
  const [centros, setCentros] = useState([]);
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [valorTotal, setValorTotal] = useState("0.00");

  // Carregar clientes
  useEffect(() => {
    api.get("/clientes")
      .then(({ data }) => setClientes(data))
      .catch(() => console.error("Erro ao carregar clientes"));
  }, []);

  // Carregar centros de custo do tipo Receita ou Ambos
  useEffect(() => {
    api.get("/centrocusto")
      .then(({ data }) => {
        const custos = data.filter(c => c.tipo === "Receita" || c.tipo === "Ambos");
        setCentros(custos);
      })
      .catch(() => console.error("Erro ao carregar centros de custo"));
  }, []);

  // Recalcular valor total
  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const d = parseFloat(desconto) || 0;
    const total = tipoDesconto === "percentual" ? v - (v * d) / 100 : v - d;
    setValorTotal(total >= 0 ? total.toFixed(2) : "0.00");
  }, [valor, desconto, tipoDesconto]);

  const salvarConta = async (depoisSalvar) => {
    try {
      const novaConta = {
        descricao,
        clienteId: clienteId || null,
        centroCustoId: centroCustoId || null,
        vencimento,
        valor: parseFloat(valor),
        desconto: parseFloat(desconto),
        tipoDesconto,
        valorTotal: parseFloat(valorTotal),
      };

      const { data } = await api.post("/contas-receber", novaConta);

      if (onSave) onSave(data);
      onClose();

      if (depoisSalvar === "pagar" && onPagar) {
        onPagar(data);
      }
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Erro ao salvar conta. Veja o console para mais detalhes.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md w-full max-w-xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-[#7ED957]">Nova Conta a Receber</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Descrição"
            className="input input-bordered w-full"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <select
            className="select select-bordered w-full"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Selecione o Cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            className="select select-bordered w-full"
            value={centroCustoId}
            onChange={(e) => setCentroCustoId(e.target.value)}
          >
            <option value="">Centro de Receita</option>
            {centros.map((c) => (
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
            className="px-5 py-2 rounded-lg text-black bg-gray-300"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-black bg-[#7ED957]"
            onClick={() => salvarConta("salvar")}
          >
            Salvar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
            onClick={() => salvarConta("pagar")}
          >
            Salvar e Pagar
          </button>
        </div>
      </div>
    </div>
  );
}
