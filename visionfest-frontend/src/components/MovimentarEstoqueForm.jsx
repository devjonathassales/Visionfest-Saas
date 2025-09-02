import React, { useState, useEffect } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function MovimentarEstoqueForm({ onClose, onSave }) {
  const { api } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState("");
  const [tipo, setTipo] = useState("entrada");

  useEffect(() => {
    (async () => {
      try {
        // 🔑 sem barra inicial => respeita baseURL "/api"
        const { data } = await api.get("/api/produtos");
        setProdutos(data || []);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    })();
  }, [api]);

  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const produtosFiltrados =
    busca.length >= 3
      ? produtos.filter((p) =>
          (p.nome || "").toLowerCase().includes(busca.toLowerCase())
        )
      : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!produtoSelecionado || !quantidade) return;
    onSave({
      produtoId: produtoSelecionado.id,
      tipo,
      quantidade: Number(quantidade),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Movimentar Estoque</h2>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Buscar Produto</label>
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setProdutoSelecionado(null);
            }}
            className="w-full border px-3 py-2 rounded"
            placeholder="Digite pelo menos 3 letras..."
          />
          {produtosFiltrados.length > 0 && (
            <ul className="border mt-2 rounded bg-white max-h-40 overflow-y-auto">
              {produtosFiltrados.map((produto) => (
                <li
                  key={produto.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setProdutoSelecionado(produto);
                    setBusca(produto.nome);
                  }}
                >
                  {produto.nome}
                </li>
              ))}
            </ul>
          )}
        </div>

        {produtoSelecionado && (
          <>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">
                Tipo de Movimentação
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#7ed957] text-white hover:bg-green-600"
          >
            Confirmar
          </button>
        </div>
      </form>
    </div>
  );
}
