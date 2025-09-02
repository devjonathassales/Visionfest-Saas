import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function ContasPagarForm({ onClose, onSave, onPagar }) {
  const { api } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [valorTotal, setValorTotal] = useState("0.00");

  const [centros, setCentros] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: centrosData } = await api.get("/api/centrocusto");
        setCentros(
          (centrosData || []).filter(
            (c) => c.tipo === "Custo" || c.tipo === "Ambos"
          )
        );
      } catch (e) {
        // silencioso
      }
      try {
        const { data: fornData } = await api.get("/api/fornecedores");
        setFornecedores(fornData || []);
      } catch (e) {
        // silencioso
      }
    })();
  }, [api]);

  useEffect(() => {
    const v = parseFloat(valor) || 0;
    const d = parseFloat(desconto) || 0;
    const total = tipoDesconto === "percentual" ? v - (v * d) / 100 : v - d;
    setValorTotal(total >= 0 ? total.toFixed(2) : "0.00");
  }, [valor, desconto, tipoDesconto]);

  const payload = () => ({
    descricao: descricao.trim(),
    centroCustoId: centroCustoId || null,
    fornecedorId: fornecedorId || null,
    vencimento: vencimento || null,
    valor: parseFloat(valor) || 0,
    desconto: parseFloat(desconto) || 0,
    tipoDesconto,
    valorTotal: parseFloat(valorTotal) || 0,
  });

  const handleSalvar = async () => {
    if (!fornecedorId) {
      alert("Selecione um fornecedor antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/api/contas-pagar", payload());
      onSave && onSave(data);
      onClose && onClose();
    } catch {
      alert("Erro ao salvar conta.");
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarEPagar = async () => {
    if (!fornecedorId) {
      alert("Selecione um fornecedor antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/api/contas-pagar", payload());
      onSave && onSave(data);
      onPagar && onPagar(data); // abre modal de pagamento vindo do pai
    } catch {
      alert("Erro ao salvar e iniciar pagamento.");
    } finally {
      setSaving(false);
    }
  };

  // ESC fecha
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4 text-[#7ED957]">
          Nova Conta a Pagar
        </h2>
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
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descricao}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered w-full"
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
          >
            <option value="">Fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
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
            min="0"
            step="0.01"
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
              min="0"
              step="0.01"
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
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#084C61" }}
            onClick={handleSalvarEPagar}
            disabled={saving}
          >
            Salvar e Pagar
          </button>
          <button
            className="px-5 py-2 rounded-lg text-black"
            style={{ backgroundColor: "#7ED957" }}
            onClick={handleSalvar}
            disabled={saving}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
