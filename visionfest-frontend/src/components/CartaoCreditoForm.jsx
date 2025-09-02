import React, { useEffect, useState } from "react";

export default function CartaoCreditoForm({ cartao, onSave, onCancel }) {
  const [banco, setBanco] = useState("");
  const [taxaVista, setTaxaVista] = useState("");
  const [taxaParcelado, setTaxaParcelado] = useState("");
  const [taxaDebito, setTaxaDebito] = useState("");

  useEffect(() => {
    if (cartao) {
      setBanco(cartao.banco || "");
      setTaxaVista(cartao.taxaVista ?? "");
      setTaxaParcelado(cartao.taxaParcelado ?? "");
      setTaxaDebito(cartao.taxaDebito ?? "");
    } else {
      setBanco("");
      setTaxaVista("");
      setTaxaParcelado("");
      setTaxaDebito("");
    }
  }, [cartao]);

  const numOrNull = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!banco.trim()) return;

    onSave({
      id: cartao?.id,
      banco: banco.trim(),
      taxaVista: numOrNull(taxaVista),
      taxaParcelado: numOrNull(taxaParcelado),
      taxaDebito: numOrNull(taxaDebito),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold">Banco</label>
        <input
          type="text"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-semibold">Taxa Crédito à Vista (%)</label>
        <input
          type="number"
          step="0.01"
          value={taxaVista}
          onChange={(e) => setTaxaVista(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Ex: 3.50"
        />
      </div>

      <div>
        <label className="block font-semibold">
          Taxa Crédito Parcelado (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={taxaParcelado}
          onChange={(e) => setTaxaParcelado(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Ex: 5.20"
        />
      </div>

      <div>
        <label className="block font-semibold">Taxa Débito (%)</label>
        <input
          type="number"
          step="0.01"
          value={taxaDebito}
          onChange={(e) => setTaxaDebito(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Ex: 1.90"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
