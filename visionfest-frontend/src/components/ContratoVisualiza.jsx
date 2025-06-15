import React from 'react';

export default function ContratoVisualizar({ contrato, clientes, produtos, formasPagamento, onClose }) {
  if (!contrato) return null;
  const cliente = clientes.find(c => c.id === Number(contrato.cliente));
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-montserrat text-primary">Contrato</h2>
        <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Fechar</button>
      </div>
      <div className="font-opensans">
        <p><strong>Cliente:</strong> {cliente?.nome}</p>
        <p><strong>Data Evento:</strong> {contrato.dataEvento} {contrato.horaInicio}–{contrato.horaFim}</p>
        <p><strong>Buffet/Bairro:</strong> {contrato.buffet}</p>
        <p><strong>Tema:</strong> {contrato.tema}</p>
        <hr/>
        <h3 className="font-semibold">Itens:</h3>
        <ul className="list-disc list-inside">
          {contrato.servicos.map((s, idx) => {
            const prod = produtos.find(p => p.id === s.produtoId);
            return (
              <li key={idx}>
                {prod?.nome} — Qtd: {s.quantidade} — Subtotal: R$ {(s.valorUnit*s.quantidade).toFixed(2)}
              </li>
            );
          })}
        </ul>
        <hr/>
        <p><strong>Total bruto:</strong> R$ {contrato.servicos.reduce((sum, s) => sum + s.valorUnit*s.quantidade,0).toFixed(2)}</p>
        <p><strong>Desconto:</strong> {contrato.descontoTipo === 'percentual' ? `${contrato.descontoValor}%` : `R$ ${contrato.descontoValor.toFixed(2)}`}</p>
        <p><strong>Total negociado:</strong> R$ {contrato.totalContrato.toFixed(2)}</p>
        <p><strong>Entrada:</strong> R$ {contrato.entradaValor.toFixed(2)} — Forma: {formasPagamento.find(f=>f.id===contrato.formaEntrada)?.nome}</p>
        {contrato.parcelas?.length > 0 && (
          <>
            <h3 className="mt-2 font-semibold">Parcelas:</h3>
            <ul className="list-decimal list-inside">
              {contrato.parcelas.map((p, i) => (
                <li key={i}>
                  R$ {p.valor.toFixed(2)} – Vence em: {p.vencimento} – Pgto: {formasPagamento.find(f=>f.id===p.formaPagamento)?.nome}
                </li>
              ))}
            </ul>
          </>
        )}
        <hr/>
        <p><strong>Data Contrato:</strong> {contrato.dataAssinatura}</p>
      </div>
    </div>
  );
}
