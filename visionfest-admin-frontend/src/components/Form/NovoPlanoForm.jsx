import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../../utils/api";

export default function NovoPlanoModal({ plano, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nome: "",
    duracao: "",
    valorTotal: "",
    valorMensal: "",
    renovacaoAutomatica: false,
    diasBloqueio: "",
    parcelasInativar: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plano) {
      setForm({
        nome: plano.nome,
        duracao: plano.duracao,
        valorTotal: plano.valorTotal || plano.valor || "", // compatibilidade
        valorMensal:
          plano.valorMensal ||
          (plano.valor && plano.duracao
            ? (plano.valor / plano.duracao).toFixed(2)
            : ""),
        renovacaoAutomatica: plano.renovacaoAutomatica,
        diasBloqueio: plano.diasBloqueio,
        parcelasInativar: plano.parcelasInativar,
      });
    }
  }, [plano]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((f) => {
      const updated = {
        ...f,
        [name]: type === "checkbox" ? checked : value,
      };

      // Atualiza valorMensal automaticamente se valorTotal e duracao existirem
      if (
        (name === "valorTotal" || name === "duracao") &&
        updated.valorTotal &&
        updated.duracao
      ) {
        const mensal =
          parseFloat(updated.valorTotal) / parseInt(updated.duracao);
        updated.valorMensal = mensal.toFixed(2);
      }

      return updated;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      valorTotal: parseFloat(form.valorTotal),
      valorMensal: parseFloat(form.valorMensal),
      duracao: parseInt(form.duracao),
      diasBloqueio: parseInt(form.diasBloqueio) || 0,
      parcelasInativar: parseInt(form.parcelasInativar) || 0,
    };

    try {
      setLoading(true);
      if (plano) {
        await api.put(`/planos/${plano.id}`, payload);
        alert("Plano atualizado com sucesso!");
      } else {
        await api.post("/planos", payload);
        alert("Plano criado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {plano ? "Editar Plano" : "Novo Plano"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={onSubmit}
          className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Nome */}
          <div>
            <label className="block text-sm mb-1">Nome *</label>
            <input
              name="nome"
              value={form.nome}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm mb-1">Duração (meses) *</label>
            <input
              name="duracao"
              value={form.duracao}
              onChange={onChange}
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          {/* Valor Total */}
          <div>
            <label className="block text-sm mb-1">Valor Total (R$) *</label>
            <input
              name="valorTotal"
              value={form.valorTotal}
              onChange={onChange}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          {/* Valor Mensal (calculado) */}
          <div>
            <label className="block text-sm mb-1">Valor Mensal (R$)</label>
            <input
              name="valorMensal"
              value={form.valorMensal}
              onChange={onChange}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2"
              readOnly
            />
          </div>

          {/* Renovação Automática */}
          <div className="flex items-center gap-2 mt-2">
            <input
              name="renovacaoAutomatica"
              type="checkbox"
              checked={form.renovacaoAutomatica}
              onChange={onChange}
            />
            <label className="text-sm">Permite Renovação Automática</label>
          </div>

          {/* Bloqueio */}
          <div>
            <label className="block text-sm mb-1">
              Bloquear após (dias atraso)
            </label>
            <input
              name="diasBloqueio"
              value={form.diasBloqueio}
              onChange={onChange}
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Inativação */}
          <div>
            <label className="block text-sm mb-1">
              Inativar com (parcelas em aberto)
            </label>
            <input
              name="parcelasInativar"
              value={form.parcelasInativar}
              onChange={onChange}
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Botões */}
          <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
