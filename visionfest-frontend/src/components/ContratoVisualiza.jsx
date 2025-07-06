import React from "react";

export default function ContratoVisualiza({ contrato, onClose }) {
  const formatarValor = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-16 z-50 overflow-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 md:p-8 overflow-auto max-h-[90vh]">
        {/* Título */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-[#7ED957]">
            Contrato - {contrato.Cliente?.nome || "Cliente não informado"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
          <div>
            <p>
              <span className="font-semibold">Data do Evento:</span>{" "}
              {contrato.dataEvento || "Não informado"}
            </p>
            <p>
              <span className="font-semibold">Horário Início:</span>{" "}
              {contrato.horarioInicio || "Não informado"}
            </p>
            {contrato.horarioTermino && (
              <p>
                <span className="font-semibold">Horário Término:</span>{" "}
                {contrato.horarioTermino}
              </p>
            )}
            <p>
              <span className="font-semibold">Local:</span>{" "}
              {contrato.localEvento || "Não informado"}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {contrato.statusPagamento || "Não informado"}
            </p>
            <p>
              <span className="font-semibold">Cor/Tema da Festa:</span>{" "}
              {contrato.temaFesta || "Não informado"}
            </p>
          </div>

          <div>
            <p>
              <span className="font-semibold">Valor Total:</span> R${" "}
              {formatarValor(contrato.valorTotal)}
            </p>
            <p>
              <span className="font-semibold">Valor Entrada:</span> R${" "}
              {formatarValor(contrato.valorEntrada)}
            </p>
            <p>
              <span className="font-semibold">Valor Restante:</span> R${" "}
              {formatarValor(contrato.valorRestante)}
            </p>
          </div>
        </div>

        {/* Produtos / Serviços */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Produtos / Serviços Contratados
          </h3>
          {contrato.Produtos?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contrato.Produtos.map((p, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 shadow-sm bg-gray-50"
                >
                  <p className="font-semibold text-[#7ED957]">
                    {p.nome || "Produto sem nome"}
                  </p>
                  <p>
                    <span className="font-semibold">Quantidade:</span>{" "}
                    {p.ContratoProduto?.quantidade}
                  </p>
                  <p>
                    <span className="font-semibold">Valor Unitário:</span> R${" "}
                    {formatarValor(p.valor)}
                  </p>
                  <p>
                    <span className="font-semibold">Data do Evento:</span>{" "}
                    {p.ContratoProduto?.dataEvento || "Não informado"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-red-500">
              ⚠ Nenhum produto encontrado neste contrato.
            </p>
          )}
        </div>

        {/* Contas a Receber */}
        {contrato.contasReceber?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Contas a Receber
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contrato.contasReceber.map((cr, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 shadow-sm bg-gray-50"
                >
                  <p>
                    <span className="font-semibold">Valor:</span> R${" "}
                    {formatarValor(cr.valor)}
                  </p>
                  <p>
                    <span className="font-semibold">Vencimento:</span>{" "}
                    {cr.vencimento || "Sem data"}
                  </p>
                  <p>
                    <span className="font-semibold">Forma Pagamento:</span>{" "}
                    {cr.formaPagamento || "Não informado"}
                  </p>
                  <p>
                    <span className="font-semibold">Tipo de Crédito:</span>{" "}
                    {cr.tipoCredito || "Não informado"}
                  </p>
                  <p>
                    <span className="font-semibold">Parcelas:</span>{" "}
                    {cr.parcelas || "1"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
