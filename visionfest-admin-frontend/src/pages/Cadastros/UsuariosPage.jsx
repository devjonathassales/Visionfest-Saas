import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import UsuarioModal from "../../components/Form/UsuarioForm";
import { Pencil, Eye, Trash, PlusCircle, UserX } from "lucide-react";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [permissoesDisponiveis, setPermissoesDisponiveis] = useState([]);

  const userLogado = JSON.parse(localStorage.getItem("usuario")); // Dados do usuário logado

  async function buscarUsuarios() {
    try {
      setLoading(true);
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      alert("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function buscarPermissoesDisponiveis() {
    try {
      const res = await api.get("/permissoes");
      setPermissoesDisponiveis(res.data);
    } catch (error) {
      alert("Erro ao buscar permissões disponíveis");
    }
  }

  useEffect(() => {
    buscarPermissoesDisponiveis();
    buscarUsuarios();
  }, []);

  async function inativarUsuario(id) {
    const confirm = window.confirm("Deseja inativar este usuário?");
    if (!confirm) return;
    try {
      await api.patch(`/usuarios/${id}/inativar`);
      alert("Usuário inativado com sucesso");
      buscarUsuarios();
    } catch {
      alert("Erro ao inativar usuário");
    }
  }

  async function excluirUsuario(id) {
    const confirm = window.confirm("Deseja excluir este usuário?");
    if (!confirm) return;
    try {
      await api.delete(`/usuarios/${id}`);
      alert("Usuário excluído com sucesso");
      buscarUsuarios();
    } catch {
      alert("Erro ao excluir usuário");
    }
  }

  const podeEditar = userLogado?.permissoes?.editarUsuarios || userLogado?.role === "superadmin";
  const podeExcluir = userLogado?.permissoes?.excluirUsuarios || userLogado?.role === "superadmin";
  const podeCriar = userLogado?.permissoes?.editarUsuarios || userLogado?.role === "superadmin";

  return (
    <div className="p-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        {podeCriar && (
          <button
            onClick={() => {
              setUsuarioSelecionado(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <PlusCircle size={18} /> Novo Usuário
          </button>
        )}
      </div>

      {loading ? (
        <p>Carregando usuários...</p>
      ) : usuarios.length === 0 ? (
        <p>Nenhum usuário cadastrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Nome</th>
              <th className="border border-gray-300 p-2 text-left">Email</th>
              <th className="border border-gray-300 p-2 text-left">Status</th>
              <th className="border border-gray-300 p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{usuario.nome}</td>
                <td className="border border-gray-300 p-2">{usuario.email}</td>
                <td className="border border-gray-300 p-2">
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </td>
                <td className="border border-gray-300 p-2 flex gap-2">
                  {podeEditar && (
                    <button
                      onClick={() => {
                        setUsuarioSelecionado(usuario);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    title="Visualizar"
                    onClick={() =>
                      alert(`Detalhes do usuário: ${usuario.nome}`)
                    }
                  >
                    <Eye size={18} />
                  </button>
                  {podeEditar && (
                    <button
                      onClick={() => inativarUsuario(usuario.id)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Inativar"
                    >
                      <UserX size={18} />
                    </button>
                  )}
                  {podeExcluir && (
                    <button
                      onClick={() => excluirUsuario(usuario.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <UsuarioModal
          usuario={usuarioSelecionado}
          onClose={() => setShowModal(false)}
          onSuccess={buscarUsuarios}
          permissoesDisponiveis={permissoesDisponiveis}
        />
      )}
    </div>
  );
}
