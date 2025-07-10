import React from "react";

export default function Step3PlanoPagamento({
  planos,
  planoSelecionado,
  setPlanoSelecionado,
  formaPagamento,
  setFormaPagamento,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Plano e Forma de Pagamento</h2>
      <select
        value={planoSelecionado}
        onChange={(e) => setPlanoSelecionado(e.target.value)}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Selecione um Plano</option>
        {planos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome} - R$ {p.valor}
          </option>
        ))}
      </select>

      <select
        value={formaPagamento}
        onChange={(e) => setFormaPagamento(e.target.value)}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Forma de Pagamento</option>
        <option value="pix">Pix</option>
        <option value="boleto">Boleto</option>
        <option value="cartao">Cartão de Crédito</option>
      </select>
    </div>
  );
}
