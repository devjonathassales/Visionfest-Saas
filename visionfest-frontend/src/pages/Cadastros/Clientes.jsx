import React, { useState, useEffect } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import ClienteForm from "../../components/ClienteForm";
import ClienteVisualizar from "../../components/ClienteVisualizar";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

export default function Clientes() {
  const { api } = useAuth(); // <- usa o axios com Bearer + X-Tenant
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("alfabetica");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteVisualizar, setClienteVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/clientes");
      setClientes(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filtrarClientes = () => {
    let lista = [...clientes];
    if (busca.length >= 3) {
      lista = lista.filter((c) =>
        (c.nome || "").toLowerCase().includes(busca.toLowerCase())
      );
    }
    if (ordenarPor === "alfabetica") {
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (ordenarPor === "data" && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      lista = lista.filter((cliente) => {
        const data = new Date(cliente.dataCadastro);
        return data >= inicio && data <= fim;
      });
    }
    return lista;
  };

  const handleSalvar = async (novoCliente) => {
    try {
      if (novoCliente.id) {
        await api.put(`/api/clientes/${novoCliente.id}`, novoCliente);
      } else {
        await api.post(`/api/clientes`, novoCliente);
      }
      await fetchClientes();
      setMostrarFormulario(false);
      setClienteSelecionado(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cliente");
    }
  };

  const handleEditar = (cliente) => {
    setClienteSelecionado(cliente);
    setMostrarFormulario(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja excluir este cliente?")) return;
    try {
      await api.delete(`/api/clientes/${id}`);
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir cliente");
    }
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-4xl font-bold text-[#7ED957] text-center mb-5">
          Cadastro de Clientes
        </h1>
      </div>

      {clienteVisualizar && (
        <ClienteVisualizar
          cliente={clienteVisualizar}
          onClose={() => setClienteVisualizar(null)}
        />
      )}

      {mostrarFormulario && (
        <ClienteForm
          onSave={handleSalvar}
          clienteSelecionado={clienteSelecionado}
          onCancel={() => {
            setMostrarFormulario(false);
            setClienteSelecionado(null);
          }}
        />
      )}

      {!mostrarFormulario && !clienteVisualizar && (
        <>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3">
              <input
                type="text"
                placeholder="Buscar cliente..."
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
                setClienteSelecionado(null);
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:bg-green-500"
            >
              <FiPlus /> <span className="hidden sm:inline">Novo Cliente</span>
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div>Carregando clientes...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-silver text-black">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left hidden md:table-cell">Email</th>
                  <th className="p-2 text-left hidden md:table-cell">
                    WhatsApp
                  </th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarClientes().map((cliente) => (
                  <tr key={cliente.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{cliente.nome}</td>
                    <td className="p-2 hidden md:table-cell">
                      {cliente.email}
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      {cliente.whatsapp}
                    </td>
                    <td className="p-2 flex justify-center gap-2 text-primary">
                      <button
                        onClick={() => setClienteVisualizar(cliente)}
                        title="Visualizar"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleEditar(cliente)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleExcluir(cliente.id)}
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
