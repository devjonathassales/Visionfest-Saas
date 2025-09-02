import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import ContaBancariaForm from "../../components/ContaBancariaForm";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function ContasBancarias() {
  const { api } = useAuth();
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregarContas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/contas-bancarias");
      setContas(data || []);
    } catch (err) {
      toast.error("Erro ao carregar contas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setFormAberto(false);
    if (formAberto) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [formAberto]);

  const contasFiltradas = contas.filter((c) => {
    const textoBusca = `${c.banco ?? ""} ${c.agencia ?? ""} ${c.conta ?? ""} ${
      c.chavePix?.tipo ?? ""
    } ${c.chavePix?.valor ?? ""}`.toLowerCase();
    return textoBusca.includes(busca.toLowerCase());
  });

  const abrirFormNovo = () => {
    setContaEditando(null);
    setFormAberto(true);
  };

  const abrirFormEditar = (conta) => {
    setContaEditando(conta);
    setFormAberto(true);
  };

  const fecharForm = () => setFormAberto(false);

  const salvarConta = async (conta) => {
    setLoading(true);
    try {
      if (conta.id) {
        await api.put(`/api/contas-bancarias/${conta.id}`, conta);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await api.post("/api/contas-bancarias", conta);
        toast.success("Conta adicionada com sucesso!");
      }
      await carregarContas();
      fecharForm();
    } catch (err) {
      const msg = err?.response?.data?.error || "Erro ao salvar conta";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    setLoading(true);
    try {
      const res = await api.delete(`/api/contas-bancarias/${id}`);
      // Alguns backends retornam 204, outros um JSON de sucesso — cobrimos os dois
      if (res?.status === 204 || res?.data) {
        toast.success("Conta excluída com sucesso!");
        await carregarContas();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Erro ao excluir conta";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-4xl font-bold text-[#7ED957] text-center">
          Contas Bancárias
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 py-5">
        <input
          type="text"
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
          disabled={loading}
        />
        <button
          onClick={abrirFormNovo}
          className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          <FiPlus /> Adicionar
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div>Carregando contas...</div>
        ) : (
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Banco</th>
                <th className="p-2">Agência</th>
                <th className="p-2">Conta</th>
                <th className="p-2">Pix</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                contasFiltradas.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{c.banco}</td>
                    <td className="p-2">{c.agencia}</td>
                    <td className="p-2">{c.conta || "-"}</td>
                    <td className="p-2">
                      {c.chavePix?.valor
                        ? `${c.chavePix.tipo}: ${c.chavePix.valor}`
                        : "-"}
                    </td>
                    <td className="p-2 text-right flex justify-end gap-2">
                      <button
                        className={`text-blue-600 ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => abrirFormEditar(c)}
                        title="Editar"
                        disabled={loading}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={`text-red-600 ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => excluirConta(c.id)}
                        title="Excluir"
                        disabled={loading}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {formAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={fecharForm}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold text-xl"
              title="Fechar"
              disabled={loading}
            >
              &times;
            </button>
            <ContaBancariaForm
              conta={contaEditando}
              onCancel={fecharForm}
              onSave={salvarConta}
            />
          </div>
        </div>
      )}
    </div>
  );
}
