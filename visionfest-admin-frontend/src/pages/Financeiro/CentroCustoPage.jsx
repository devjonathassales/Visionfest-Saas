import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import CentroCustoForm from "../../components/Form/CentroCustoForm"; // confirma se está nesse path
import { Pencil, Trash, PlusCircle } from "lucide-react";

export default function CentrosCustoPage() {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [centroSelecionado, setCentroSelecionado] = useState(null);

  async function buscarCentros() {
    try {
      setLoading(true);
      const res = await api.get("/centros-custo");
      setCentros(res.data);
    } catch (error) {
      alert("Erro ao buscar centros de custo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarCentros();
  }, []);

  async function salvarCentro(dados) {
    try {
      if (dados.id) {
        await api.put(`/centros-custo/${dados.id}`, dados);
        alert("Centro de custo atualizado com sucesso!");
      } else {
        await api.post("/centros-custo", dados);
        alert("Centro de custo criado com sucesso!");
      }
      buscarCentros();
      setShowModal(false);
    } catch (err) {
      alert("Erro ao salvar centro de custo.");
    }
  }

  async function excluirCentro(id) {
    const confirmar = window.confirm("Deseja excluir este centro de custo?");
    if (!confirmar) return;

    try {
      await api.delete(`/centros-custo/${id}`);
      alert("Centro de custo excluído com sucesso!");
      buscarCentros();
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data.error || "Este centro não pode ser excluído.");
      } else {
        alert("Erro ao excluir centro de custo.");
      }
    }
  }

  const filtrados = centros.filter((c) =>
    c.descricao.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="p-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Centros de Custo</h1>
        <button
          onClick={() => {
            setCentroSelecionado(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <PlusCircle size={18} /> Novo Centro
        </button>
      </div>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Pesquisar centro de custo..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <p>Carregando centros de custo...</p>
      ) : filtrados.length === 0 ? (
        <p>Nenhum centro de custo encontrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Descrição</th>
              <th className="border border-gray-300 p-2 text-left">Tipo</th>
              <th className="border border-gray-300 p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{c.descricao}</td>
                <td className="border border-gray-300 p-2">{c.tipo}</td>
                <td className="border border-gray-300 p-2 text-center flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setCentroSelecionado(c);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => excluirCentro(c.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <CentroCustoForm
          onClose={() => {
            setShowModal(false);
            setCentroSelecionado(null);
          }}
          onSalvar={salvarCentro}
          centroSelecionado={centroSelecionado}
        />
      )}
    </div>
  );
}
