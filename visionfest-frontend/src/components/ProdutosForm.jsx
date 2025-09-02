import React, { useEffect, useState } from "react";

// Converte string digitada em moeda BR para formato "R$ x,xx"
function toCurrencyBRFromDigits(str) {
  const digits = String(str || "").replace(/\D/g, "");
  const cents = parseInt(digits || "0", 10);
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Converte "R$ 1.234,56" => 1234.56 (Number)
function currencyStrToNumberBR(str) {
  if (!str) return 0;
  const clean = String(str)
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export default function ProdutosForm({ onSave, produtoSelecionado, onCancel }) {
  const [nome, setNome] = useState("");
  const [valorStr, setValorStr] = useState("R$ 0,00");
  const [movimentaEstoque, setMovimentaEstoque] = useState(true);
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [tipoProduto, setTipoProduto] = useState("venda"); // venda | locacao

  useEffect(() => {
    if (produtoSelecionado) {
      setNome(produtoSelecionado.nome || "");
      setValorStr(
        typeof produtoSelecionado.valor === "number"
          ? produtoSelecionado.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "R$ 0,00"
      );
      setMovimentaEstoque(produtoSelecionado.movimentaEstoque ?? true);
      setEstoqueMinimo(produtoSelecionado.estoqueMinimo ?? "");
      setTipoProduto(produtoSelecionado.tipoProduto || "venda");
    } else {
      setNome("");
      setValorStr("R$ 0,00");
      setMovimentaEstoque(true);
      setEstoqueMinimo("");
      setTipoProduto("venda");
    }
  }, [produtoSelecionado]);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  function handleValorChange(e) {
    setValorStr(toCurrencyBRFromDigits(e.target.value));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!nome.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    if (estoqueMinimo === "" || Number(estoqueMinimo) < 0) {
      alert("Estoque mínimo deve ser zero ou maior");
      return;
    }

    onSave({
      id: produtoSelecionado?.id,
      nome: nome.trim(),
      valor: currencyStrToNumberBR(valorStr),
      movimentaEstoque: !!movimentaEstoque,
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : 0,
      tipoProduto,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 border rounded shadow bg-white"
    >
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
          value={valorStr}
          onChange={handleValorChange}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">
          Tipo de Produto/Serviço
        </label>
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
          checked={!!movimentaEstoque}
          onChange={() => setMovimentaEstoque((v) => !v)}
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
