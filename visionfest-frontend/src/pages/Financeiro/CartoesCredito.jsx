import React, { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import CartaoCreditoForm from "../../components/CartaoCreditoForm";

export default function CartoesCredito() {
  const [cartoes, setCartoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);

  useEffect(() => {
    setCartoes([
      {
        id: 1,
        banco: "Nubank",
        taxaVista: 2.9,
        taxaParcelado: 4.5,
      },
    ]);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setFormAberto(false);
      }
    };
    if (formAberto) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [formAberto]);

  const abrirFormNovo = () => {
    setCartaoEditando(null);
    setFormAberto(true);
  };

  const abrirFormEditar = (cartao) => {
    setCartaoEditando(cartao);
    setFormAberto(true);
  };

  const salvarCartao = (cartao) => {
    if (cartao.id) {
      setCartoes(cartoes.map((c) => (c.id === cartao.id ? cartao : c)));
      toast.success("Cartão atualizado com sucesso!");
    } else {
      cartao.id = Date.now();
      setCartoes([...cartoes, cartao]);
      toast.success("Cartão adicionado com sucesso!");
    }
    setFormAberto(false);
  };

  const excluirCartao = (id) => {
    // Adicione verificação futura para uso em títulos
    setCartoes(cartoes.filter((c) => c.id !== id));
    toast.success("Cartão excluído com sucesso!");
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
        <table className="w-full border border-gray-200">
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
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.banco}</td>
                <td className="p-2">{c.taxaDebito ?? "-"}</td>
                <td className="p-2">{c.taxaVista ?? "-"}</td>
                <td className="p-2">{c.taxaParcelado ?? "-"}</td>
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
          </tbody>
        </table>
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
