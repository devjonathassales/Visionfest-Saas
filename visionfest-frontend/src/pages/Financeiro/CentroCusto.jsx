import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { useAuth } from "/src/contexts/authContext.jsx";
import CentroCustoForm from "../../components/CentroCustoForm";

export default function CentroCustoReceita() {
  const { api } = useAuth(); // axios com baseURL, X-Tenant e Bearer
  const [centros, setCentros] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [centroSelecionado, setCentroSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/centrocusto");
      setCentros(data || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar centros de custo/receita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = centros.filter((c) =>
    (c.descricao || "").toLowerCase().includes((pesquisa || "").toLowerCase())
  );

  const handleSalvar = async (dados) => {
    try {
      if (dados.id) {
        await api.put(`/api/centrocusto/${dados.id}`, dados);
      } else {
        await api.post(`/api/centrocusto`, dados);
      }
      await fetchCentros();
      setFormAberto(false);
      setCentroSelecionado(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar centro de custo/receita");
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este centro?")) return;
    try {
      await api.delete(`/api/centrocusto/${id}`);
      await fetchCentros();
    } catch (err) {
      // se o backend retornar 400/409 com mensagem, tente exibir
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Erro ao excluir";
      alert(msg);
    }
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-4xl font-bold text-[#7ED957] text-center">
          Centros de Custo/Receitas
        </h1>
      </div>

      <div className="flex justify-between items-center mb-4 py-5 gap-3">
        <input
          type="text"
          placeholder="Pesquisar centro de custo..."
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => {
            setCentroSelecionado(null);
            setFormAberto(true);
          }}
        >
          <FiPlus className="inline mr-1" />
          Adicionar
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="w-full border text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Descrição</th>
              <th className="p-2 border">Tipo</th>
              <th className="p-2 border text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-2 border">{c.descricao}</td>
                <td className="p-2 border">{c.tipo}</td>
                <td className="p-2 border">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setCentroSelecionado(c);
                        setFormAberto(true);
                      }}
                      title="Editar"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleExcluir(c.id)}
                      title="Excluir"
                      className="text-red-500"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td className="p-3 text-center border" colSpan={3}>
                  Nenhum centro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {formAberto && (
        <CentroCustoForm
          onClose={() => {
            setCentroSelecionado(null);
            setFormAberto(false);
          }}
          onSalvar={handleSalvar}
          centroSelecionado={centroSelecionado}
        />
      )}
    </div>
  );
}
