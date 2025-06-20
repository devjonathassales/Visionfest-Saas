import React, { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import CartaoCreditoForm from "../../components/CartaoCreditoForm";

const API_URL = "http://localhost:5000/api/cartoes-credito";

export default function CartoesCredito() {
  const [cartoes, setCartoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscarCartoes = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Erro ao carregar cartões");
      const data = await res.json();
      setCartoes(data);
    } catch (err) {
      toast.error("Erro ao buscar cartões: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarCartoes();
  }, []);

  const abrirFormNovo = () => {
    setCartaoEditando(null);
    setFormAberto(true);
  };

  const abrirFormEditar = (cartao) => {
    setCartaoEditando(cartao);
    setFormAberto(true);
  };

  const salvarCartao = async (cartao) => {
    try {
      const metodo = cartao.id ? "PUT" : "POST";
      const url = cartao.id ? `${API_URL}/${cartao.id}` : API_URL;

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartao),
      });

      if (!res.ok) throw new Error("Erro ao salvar cartão");
      toast.success(
        cartao.id
          ? "Cartão atualizado com sucesso!"
          : "Cartão adicionado com sucesso!"
      );
      buscarCartoes();
      setFormAberto(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const excluirCartao = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este cartão?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (res.status === 409) {
        toast.warn(
          "Este cartão não pode ser excluído pois está vinculado a transações."
        );
        return;
      }

      if (!res.ok) throw new Error("Erro ao excluir cartão");

      toast.success("Cartão excluído com sucesso!");
      buscarCartoes();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const cartoesFiltrados = cartoes.filter((c) =>
    c.banco.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar cartão..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
        />
        <button
          onClick={abrirFormNovo}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiPlus /> Adicionar
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div>Carregando cartões...</div>
        ) : (
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Banco</th>
                <th className="p-2">Taxa Débito (%)</th>
                <th className="p-2">Taxa à Vista (%)</th>
                <th className="p-2">Taxa Parcelado (%)</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cartoesFiltrados.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{c.banco}</td>
                  <td className="p-2">
                    {c.taxaDebito !== undefined &&
                    c.taxaDebito !== null &&
                    c.taxaDebito !== ""
                      ? Number(c.taxaDebito).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-2">
                    {c.taxaVista !== undefined &&
                    c.taxaVista !== null &&
                    c.taxaVista !== ""
                      ? Number(c.taxaVista).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-2">
                    {c.taxaParcelado !== undefined &&
                    c.taxaParcelado !== null &&
                    c.taxaParcelado !== ""
                      ? Number(c.taxaParcelado).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-2 text-right flex justify-end gap-2">
                    <button
                      className="text-blue-600"
                      onClick={() => abrirFormEditar(c)}
                      title="Editar"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="text-red-600"
                      onClick={() => excluirCartao(c.id)}
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {cartoesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    Nenhum cartão encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {formAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setFormAberto(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold text-xl"
              title="Fechar"
            >
              &times;
            </button>
            <CartaoCreditoForm
              cartao={cartaoEditando}
              onCancel={() => setFormAberto(false)}
              onSave={salvarCartao}
            />
          </div>
        </div>
      )}
    </div>
  );
}
