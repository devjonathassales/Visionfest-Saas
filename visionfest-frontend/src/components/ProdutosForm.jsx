import React, { useState, useEffect } from 'react';

function formatarValor(valor) {
  const numeros = valor.replace(/\D/g, '');
  const numeroFloat = Number(numeros) / 100;
  return numeroFloat.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function limparFormatacao(valor) {
  if (!valor) return 0;
  return Number(
    valor.replace(/[R$\s.]/g, '').replace(',', '.') || 0
  );
}

export default function ProdutosForm({ onSave, produtoSelecionado, onCancel }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('R$ 0,00');
  const [movimentaEstoque, setMovimentaEstoque] = useState(true);
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [tipoProduto, setTipoProduto] = useState('venda'); // 'venda' ou 'locacao'

  useEffect(() => {
    if (produtoSelecionado) {
      setNome(produtoSelecionado.nome || '');
      setValor(
        produtoSelecionado.valor !== undefined
          ? formatarValor(String(produtoSelecionado.valor * 100))
          : 'R$ 0,00'
      );
      setMovimentaEstoque(produtoSelecionado.movimentaEstoque ?? true);
      setEstoqueMinimo(produtoSelecionado.estoqueMinimo ?? '');
      setTipoProduto(produtoSelecionado.tipoProduto || 'venda');
    } else {
      setNome('');
      setValor('R$ 0,00');
      setMovimentaEstoque(true);
      setEstoqueMinimo('');
      setTipoProduto('venda');
    }
  }, [produtoSelecionado]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleValorChange = (e) => {
    const raw = e.target.value;
    setValor(formatarValor(raw));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if (estoqueMinimo === '' || Number(estoqueMinimo) < 0) {
      alert('Estoque mínimo deve ser zero ou maior');
      return;
    }

    onSave({
      id: produtoSelecionado?.id,
      nome,
      valor: limparFormatacao(valor),
      movimentaEstoque,
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : 0,
      tipoProduto,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded shadow bg-white">
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Nome *</label>
        <input
          type="text"
          className="input border border-gray-300 px-3 py-2 rounded w-full"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Valor (opcional)</label>
        <input
          type="text"
          className="input border border-gray-300 px-3 py-2 rounded w-full"
          value={valor}
          onChange={handleValorChange}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Tipo de Produto/Serviço</label>
        <select
          value={tipoProduto}
          onChange={(e) => setTipoProduto(e.target.value)}
          className="input border border-gray-300 px-3 py-2 rounded w-full"
        >
          <option value="venda">Venda</option>
          <option value="locacao">Locação</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="movimentaEstoque"
          checked={movimentaEstoque}
          onChange={() => setMovimentaEstoque(!movimentaEstoque)}
          className="form-checkbox h-5 w-5"
        />
        <label htmlFor="movimentaEstoque" className="font-semibold select-none">
          Movimenta estoque
        </label>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Estoque mínimo *</label>
        <input
          type="number"
          min="0"
          className="input border border-gray-300 px-3 py-2 rounded w-full"
          value={estoqueMinimo}
          onChange={(e) => setEstoqueMinimo(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-[#c0c0c0] border border-gray-400 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-[#7ed957] text-white hover:bg-green-600"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
