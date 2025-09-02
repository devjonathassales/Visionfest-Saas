import React, { useState, useEffect } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import FuncionarioForm from "/src/components/FuncionarioForm.jsx";
import FuncionarioVisualizar from "/src/components/FuncionarioVisualizar.jsx";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

export default function Funcionarios() {
  const { api } = useAuth(); // axios com Bearer + X-Tenant
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("alfabetica");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [funcionarioVisualizar, setFuncionarioVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/funcionarios");
      setFuncionarios(data || []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar funcionários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrarFuncionarios = () => {
    let lista = [...funcionarios];
    if (busca.length >= 3) {
      lista = lista.filter((f) =>
        (f.nome || "").toLowerCase().includes(busca.toLowerCase())
      );
    }
    if (ordenarPor === "alfabetica") {
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenarPor === "data" && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      lista = lista.filter((f) => {
        const data = new Date(f.dataCadastro || f.createdAt || 0);
        return data >= inicio && data <= fim;
      });
    }
    return lista;
  };

  const handleSalvar = async (novoFuncionario) => {
    try {
      if (novoFuncionario.id) {
        await api.put(
          `/api/funcionarios/${novoFuncionario.id}`,
          novoFuncionario
        );
      } else {
        await api.post(`/api/funcionarios`, novoFuncionario);
      }
      await fetchFuncionarios();
      setMostrarFormulario(false);
      setFuncionarioSelecionado(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar funcionário");
    }
  };

  const handleEditar = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja excluir este funcionário?")) return;
    try {
      await api.delete(`/api/funcionarios/${id}`);
      setFuncionarios((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir funcionário");
    }
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-4xl font-bold text-[#7ED957] text-center mb-5">
          Cadastro de Funcionários
        </h1>
      </div>

      {funcionarioVisualizar && (
        <FuncionarioVisualizar
          funcionario={funcionarioVisualizar}
          onClose={() => setFuncionarioVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <FuncionarioForm
          onSave={handleSalvar}
          funcionarioSelecionado={funcionarioSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setFuncionarioSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !funcionarioVisualizar && (
        <>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar funcionário..."
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
                setFuncionarioSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus />{" "}
              <span className="hidden sm:inline">Novo Funcionário</span>
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div>Carregando funcionários...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left hidden md:table-cell">Email</th>
                  <th className="p-2 text-left hidden md:table-cell">Função</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarFuncionarios().map((f) => (
                  <tr key={f.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{f.nome}</td>
                    <td className="p-2 hidden md:table-cell">{f.email}</td>
                    <td className="p-2 hidden md:table-cell">
                      {f.funcao || f.cargo}
                    </td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button
                        onClick={() => setFuncionarioVisualizar(f)}
                        title="Visualizar"
                      >
                        <FiEye />
                      </button>
                      <button onClick={() => handleEditar(f)} title="Editar">
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleExcluir(f.id)}
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
