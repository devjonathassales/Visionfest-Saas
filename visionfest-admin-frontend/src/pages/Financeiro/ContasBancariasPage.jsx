import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import ContaBancariaForm from "../../components/Form/ContaBancariaForm";
import { toast } from "react-toastify";
import api from "../../utils/api";

export default function ContasBancarias() {
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregarContas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contas-bancarias");
      setContas(res.data);
    } catch (err) {
      toast.error("Erro ao carregar contas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);

  const salvarConta = async (conta) => {
    setLoading(true);
    try {
      if (conta.id) {
        await api.put(`/contas-bancarias/${conta.id}`, conta);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/contas-bancarias", conta);
        toast.success("Conta adicionada com sucesso!");
      }
      await carregarContas();
      setFormAberto(false);
    } catch (err) {
      toast.error("Erro ao salvar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    setLoading(true);
    try {
      await api.delete(`/contas-bancarias/${id}`);
      toast.success("Conta excluída com sucesso!");
      await carregarContas();
    } catch (err) {
      toast.error("Erro ao excluir conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const contasFiltradas = contas.filter((c) =>
    c.banco.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 pt-20">
      <h1 className="text-3xl font-bold text-green-500 mb-4">Contas Bancárias</h1>

      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-sm"
        />
        <button
          onClick={() => {
            setContaEditando(null);
            setFormAberto(true);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 max-w-max"
        >
          <FiPlus /> Nova Conta
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Banco</th>
              <th className="p-2 text-left">Agência</th>
              <th className="p-2 text-left">Conta</th>
              <th className="p-2 text-left">Pix</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{c.banco}</td>
                <td className="p-2">{c.agencia}</td>
                <td className="p-2">{c.conta || "-"}</td>
                <td className="p-2">
                  {c.chavePix ? `${c.chavePix.tipo}: ${c.chavePix.valor}` : "-"}
                </td>
                <td className="p-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setContaEditando(c);
                      setFormAberto(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => excluirConta(c.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
            {contasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-2 shadow-lg relative">
            <ContaBancariaForm
              conta={contaEditando}
              onCancel={() => setFormAberto(false)}
              onSave={salvarConta}
              disabled={loading}
            />
            <button
              onClick={() => setFormAberto(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Fechar"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
