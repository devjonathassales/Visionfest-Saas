import React from 'react';

export default function ContratoVisualiza({ contrato, onClose }) {
  if (!contrato) return null;

  const {
    cliente,
    produtos,
    tema,
    cerimonialista,    // adicionado aqui
    dataEvento,
    horaInicio,
    horaFim,
    endereco,
    buffet,
    valorTotal,
    desconto,
    valorFinal,
    entrada,
    formaEntrada,
    parcelas,
    dataContrato,
    empresa,
  } = contrato;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl p-8 rounded shadow overflow-y-auto max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-green-600">Contrato</h2>
            <p className="text-sm text-gray-500">Data de Assinatura: {dataContrato}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 font-bold text-xl"
          >
            ×
          </button>
        </div>

        {/* Empresa */}
        <div className="mb-6 border p-4 rounded">
          <h3 className="font-semibold text-gray-700">Dados da Empresa</h3>
          <p><strong>{empresa?.nome}</strong></p>
          <p>{empresa?.endereco}</p>
          <p>{empresa?.telefone} | {empresa?.email}</p>
          {empresa?.logo && (
            <img src={empresa.logo} alt="Logo Empresa" className="h-16 mt-2" />
          )}
        </div>

        {/* Cliente */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Cliente:</h3>
          <p><strong>{cliente}</strong></p>
        </div>

        {/* Detalhes do Evento */}
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700">Tema / Cores:</h4>
            <p>{tema || 'Não informado'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Cerimonialista:</h4>
            <p>{cerimonialista || 'Não informado'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Data do Evento:</h4>
            <p>{dataEvento} - {horaInicio} às {horaFim}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Buffet / Bairro:</h4>
            <p>{buffet}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Endereço do Evento:</h4>
            <p>{endereco || 'Não informado'}</p>
          </div>
        </div>

        {/* Produtos / Serviços */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Produtos / Serviços Contratados:</h4>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Produto</th>
                <th className="border px-2 py-1 text-center">Qtd</th>
                <th className="border px-2 py-1 text-right">Valor Unit.</th>
                <th className="border px-2 py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((item, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1">{item.nome}</td>
                  <td className="border px-2 py-1 text-center">{item.quantidade}</td>
                  <td className="border px-2 py-1 text-right">R$ {item.preco.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Valores Financeiros */}
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <p>Valor Total: <strong>R$ {valorTotal.toFixed(2)}</strong></p>
            <p>Desconto: <strong>R$ {desconto.toFixed(2)}</strong></p>
            <p>Valor Final: <strong>R$ {valorFinal.toFixed(2)}</strong></p>
          </div>
          <div>
            <p>Entrada: <strong>R$ {entrada.toFixed(2)}</strong></p>
            <p>Forma de Pagamento da Entrada: <strong>{formaEntrada}</strong></p>
            <p>Restante: <strong>R$ {(valorFinal - entrada).toFixed(2)}</strong></p>
          </div>
        </div>

        {/* Parcelas */}
        {parcelas.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-2">Parcelas do Restante:</h4>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-center">Nº</th>
                  <th className="border px-2 py-1 text-right">Valor</th>
                  <th className="border px-2 py-1 text-center">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((parcela, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1 text-right">R$ {parseFloat(parcela.valor).toFixed(2)}</td>
                    <td className="border px-2 py-1 text-center">{parcela.vencimento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assinaturas */}
        <div className="mt-10 flex justify-between items-center">
          <div className="text-center">
            <div className="border-t border-black w-64 mx-auto"></div>
            <p className="text-sm mt-1">Assinatura do Cliente</p>
          </div>
          <div className="text-center">
            <div className="border-t border-black w-64 mx-auto"></div>
            <p className="text-sm mt-1">Assinatura da Empresa</p>
          </div>
        </div>

      </div>
    </div>
  );
}
