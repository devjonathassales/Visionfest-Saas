import React, { useState, useEffect } from 'react';
import ProdutosForm from '../../components/ProdutosForm';
import ProdutoVisualizar from '../../components/ProdutosVisualiza';
import { FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('alfabetica');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [produtoVisualizar, setProdutoVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/produtos`);
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (error) {
      alert('Erro ao carregar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const filtrarProdutos = () => {
    let lista = [...produtos];

    if (busca.length >= 3) {
      lista = lista.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (ordenarPor === 'alfabetica') {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return lista;
  };

  const handleSalvar = async (novoProduto) => {
    try {
      let res;
      if (novoProduto.id) {
        res = await fetch(`${API_BASE_URL}/produtos/${novoProduto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoProduto),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoProduto),
        });
      }

      if (!res.ok) throw new Error('Erro ao salvar produto');
      await fetchProdutos();

      setMostrarFormulario(false);
      setProdutoSelecionado(null);
    } catch (error) {
      alert('Erro ao salvar produto: ' + error.message);
    }
  };

  const handleEditar = (produto) => {
    setProdutoSelecionado(produto);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir este produto?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/produtos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir produto');
      setProdutos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao excluir produto: ' + error.message);
    }
  };

  return (
    <div className="p-4">
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
                {filtrarProdutos().map(produto => (
                  <tr key={produto.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{produto.nome}</td>
                    <td className="p-2">{produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2">{produto.movimentaEstoque ? 'Sim' : 'Não'}</td>
                    <td className="p-2">{produto.estoqueMinimo}</td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button onClick={() => setProdutoVisualizar(produto)} title="Visualizar">
                        <FiEye />
                      </button>
                      <button onClick={() => handleEditar(produto)} title="Editar">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleExcluir(produto.id)} title="Excluir">
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
