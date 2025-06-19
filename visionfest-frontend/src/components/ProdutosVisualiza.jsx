import React from 'react';

export default function ProdutosVisualiza({ produto, onClose }) {
  if (!produto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
      <div className="bg-white rounded shadow max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold text-xl"
          title="Fechar"
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold mb-4">Detalhes do Produto/Serviço</h2>

        <p><strong>Nome:</strong> {produto.nome}</p>
        <p>
          <strong>Valor:</strong>{' '}
          {produto.valor !== undefined
            ? produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '—'}
        </p>
        <p><strong>Movimenta Estoque:</strong> {produto.movimentaEstoque ? 'Sim' : 'Não'}</p>
        <p><strong>Estoque Mínimo:</strong> {produto.estoqueMinimo}</p>
        <p><strong>Tipo de Produto/Serviço:</strong> {produto.tipoProduto === 'venda' ? 'Venda' : 'Locação'}</p>
      </div>
    </div>
  );
}
