import React, { useState, useEffect } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import ProdutosForm from "../../components/ProdutosForm.jsx";
import ProdutoVisualizar from "../../components/ProdutosVisualiza.jsx";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

export default function Produtos() {
  const { api } = useAuth(); // axios com Bearer + X-Tenant
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("alfabetica");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [produtoVisualizar, setProdutoVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchProdutos() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/produtos");
      setProdutos(data || []);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProdutos();
  }, []);

  function filtrarProdutos() {
    let lista = [...produtos];

    if (busca.trim().length >= 3) {
      const q = busca.toLowerCase();
      lista = lista.filter((p) => (p.nome || "").toLowerCase().includes(q));
    }

    if (ordenarPor === "alfabetica") {
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    }

    return lista;
  }

  async function handleSalvar(novoProduto) {
    try {
      if (novoProduto.id) {
        await api.put(`/api/produtos/${novoProduto.id}`, novoProduto);
      } else {
        await api.post(`/api/produtos`, novoProduto);
      }
      await fetchProdutos();
      setMostrarFormulario(false);
      setProdutoSelecionado(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar produto");
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Deseja excluir este produto?")) return;
    try {
      await api.delete(`/api/produtos/${id}`);
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Erro ao excluir produto";
      alert(msg);
    }
  }

  function handleEditar(produto) {
    setProdutoSelecionado(produto);
    setMostrarFormulario(true);
  }

  return (
    <div className="p-4">
      <div>
        <h1 className="text-4xl font-bold text-[#7ED957] text-center mb-5">
          Cadastro de Produtos/Serviços
        </h1>
      </div>

      {produtoVisualizar && (
        <ProdutoVisualizar
          produto={produtoVisualizar}
          onClose={() => setProdutoVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <ProdutosForm
          onSave={handleSalvar}
          produtoSelecionado={produtoSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setProdutoSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !produtoVisualizar && (
        <>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar produto..."
                className="input border border-gray-300 px-3 py-2 rounded w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="input border border-gray-300 px-3 py-2 rounded w-40"
              >
                <option value="alfabetica">Ordem Alfabética</option>
              </select>
            </div>

            <button
              onClick={() => {
                setProdutoSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500 whitespace-nowrap"
            >
              <FiPlus /> Novo Produto
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div>Carregando produtos...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Valor</th>
                  <th className="p-2 text-left">Movimenta Estoque</th>
                  <th className="p-2 text-left">Estoque Mínimo</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarProdutos().map((produto) => (
                  <tr key={produto.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{produto.nome}</td>
                    <td className="p-2">
                      {typeof produto.valor === "number"
                        ? produto.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </td>
                    <td className="p-2">
                      {produto.movimentaEstoque ? "Sim" : "Não"}
                    </td>
                    <td className="p-2">{produto.estoqueMinimo ?? 0}</td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button
                        onClick={() => setProdutoVisualizar(produto)}
                        title="Visualizar"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleEditar(produto)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleExcluir(produto.id)}
                        title="Excluir"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
