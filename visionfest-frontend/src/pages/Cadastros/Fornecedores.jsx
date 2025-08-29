import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { useAuth } from "/src/contexts/authContext.jsx";
import FornecedorForm from "/src/components/FornecedorForm.jsx";
import FornecedorVisualizar from "/src/components/FornecedorVisualizar.jsx";

export default function Fornecedores() {
  const { api } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("alfabetica");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [fornecedorVisualizar, setFornecedorVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/fornecedores");
      setFornecedores(data || []);
    } catch (e) {
      alert("Erro ao carregar fornecedores.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const listaFiltrada = useMemo(() => {
    let lista = [...fornecedores];

    if (busca.trim().length >= 3) {
      const q = busca.toLowerCase();
      lista = lista.filter((f) => (f.nome || "").toLowerCase().includes(q));
    }

    if (ordenarPor === "alfabetica") {
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenarPor === "data" && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      lista = lista.filter((f) => {
        const d = new Date(f.dataCadastro || f.createdAt || 0);
        return d >= inicio && d <= fim;
      });
    }

    return lista;
  }, [fornecedores, busca, ordenarPor, dataInicio, dataFim]);

  const handleSalvar = async (payload) => {
    try {
      if (payload.id) {
        await api.put(`/api/fornecedores/${payload.id}`, payload);
      } else {
        await api.post(`/api/fornecedores`, payload);
      }
      await fetchFornecedores();
      setMostrarFormulario(false);
      setFornecedorSelecionado(null);
    } catch (e) {
      alert("Erro ao salvar fornecedor.");
      console.error(e);
    }
  };

  const handleEditar = (fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja excluir este fornecedor?")) return;
    try {
      await api.delete(`/api/fornecedores/${id}`);
      setFornecedores((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      alert("Erro ao excluir fornecedor.");
      console.error(e);
    }
  };

  return (
    <div className="p-4">
      {fornecedorVisualizar && (
        <FornecedorVisualizar
          fornecedor={fornecedorVisualizar}
          onClose={() => setFornecedorVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <FornecedorForm
          onSave={handleSalvar}
          fornecedorSelecionado={fornecedorSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setFornecedorSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !fornecedorVisualizar && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar fornecedor..."
                className="input border border-gray-300 px-3 py-2 rounded w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="input border border-gray-300 px-3 py-2 rounded"
              >
                <option value="alfabetica">Ordem Alfabética</option>
                <option value="data">Data de Cadastro</option>
              </select>
            </div>

            {ordenarPor === "data" && (
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="date"
                  className="input border border-gray-300 px-3 py-2 rounded"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
                <input
                  type="date"
                  className="input border border-gray-300 px-3 py-2 rounded"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={() => {
                setFornecedorSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus />{" "}
              <span className="hidden sm:inline">Novo Fornecedor</span>
            </button>
          </div>

          {loading ? (
            <p>Carregando fornecedores...</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left hidden md:table-cell">
                    CPF/CNPJ
                  </th>
                  <th className="p-2 text-left hidden md:table-cell">
                    Endereço
                  </th>
                  <th className="p-2 text-left hidden md:table-cell">Email</th>
                  <th className="p-2 text-left hidden md:table-cell">
                    WhatsApp
                  </th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((fornecedor) => (
                  <tr key={fornecedor.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{fornecedor.nome}</td>
                    <td className="p-2 hidden md:table-cell">
                      {fornecedor.cpfCnpj}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {fornecedor.endereco}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {fornecedor.email}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {fornecedor.whatsapp}
                    </td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button
                        onClick={() => setFornecedorVisualizar(fornecedor)}
                        title="Visualizar"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleEditar(fornecedor)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleExcluir(fornecedor.id)}
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
