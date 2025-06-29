import React from "react";

export default function ContratoVisualiza({ contrato, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 overflow-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold text-[#7ED957] mb-6">
          Contrato - {contrato.cliente}
        </h2>

        <div className="space-y-3 text-sm md:text-base">
          <p><strong>Data do Evento:</strong> {contrato.dataEvento}</p>
          <p><strong>Horário Início:</strong> {contrato.horarioInicio}</p>
          {contrato.horarioTermino && <p><strong>Horário Término:</strong> {contrato.horarioTermino}</p>}
          <p><strong>Local:</strong> {contrato.local} - {contrato.bairro}</p>
          <p><strong>Status:</strong> {contrato.status}</p>
          <p><strong>Valor Total:</strong> R$ {contrato.valorTotal?.toFixed(2)}</p>

          <h3 className="font-semibold mt-6">Produtos / Serviços</h3>
          <ul className="list-disc list-inside">
            {contrato.produtosSelecionados?.map((p) => (
              <li key={p.produtoId}>
                {p.nome} - Qtd: {p.quantidade} - Valor Unit: R$ {p.valor.toFixed(2)}
              </li>
            ))}
          </ul>

          <p className="mt-6"><strong>Cor/Tema da Festa:</strong> {contrato.corTema || "Não informado"}</p>
          <p><strong>Endereço do Evento:</strong> {contrato.enderecoEvento || "Não informado"}</p>
          <p><strong>Nome do Buffet/Bairro:</strong> {contrato.nomeBuffet}</p>
          <p><strong>Valor Entrada:</strong> R$ {contrato.valorEntrada?.toFixed(2) || "0.00"}</p>
          <p><strong>Forma Pagamento Entrada:</strong> {contrato.formaPagamentoEntradaNome || contrato.formaPagamentoEntradaId || "-"}</p>
          <p><strong>Valor Restante:</strong> R$ {contrato.valorRestante?.toFixed(2) || "0.00"}</p>

          {contrato.parcelas?.length > 0 && (
            <>
              <h3 className="font-semibold mt-6">Parcelas</h3>
              <ul className="list-disc list-inside">
                {contrato.parcelas.map((p, i) => (
                  <li key={i}>
                    R$ {Number(p.valor).toFixed(2)} - Vencimento: {p.vencimento}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex justify-end mt-6 gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
