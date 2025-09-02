import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import { toast } from "react-toastify";
import ModalPermissoes from "../../components/ModalPermissoes";

export default function PermissoesPage() {
  const { apiCliente } = useAuth();
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissoesUsuario, setPermissoesUsuario] = useState(null);

  const carregarUsuarios = async () => {
    if (!apiCliente) return; // evita get em undefined
    setLoading(true);
    try {
      const { data } = await apiCliente.get("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const carregarPermissoes = async (usuario) => {
    if (!apiCliente || !usuario?.id) return;
    try {
      const { data } = await apiCliente.get(`/permissoes/${usuario.id}`);
      setPermissoesUsuario(data?.permissoes || {});
      setUsuarioSelecionado(usuario);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Erro ao carregar permissões do usuário"
      );
    }
  };

  useEffect(() => {
    carregarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCliente]);

  const usuariosFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome?.toLowerCase().includes(termo) ||
        u.email?.toLowerCase().includes(termo)
    );
  }, [usuarios, filtro]);

  const salvarPermissoes = async (usuarioId, permissoesAtualizadas) => {
    if (!apiCliente) return;
    try {
      await apiCliente.put(`/permissoes/${usuarioId}`, {
        permissoes: permissoesAtualizadas,
      });
      toast.success("Permissões salvas com sucesso!");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Erro ao salvar permissões";
      toast.error(msg);
      throw err; // mantém erro para o Modal exibir estado “Salvando...”
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-[#7ED957] font-montserrat">
        Gerenciar Permissões
      </h1>

      <input
        type="text"
        placeholder="Buscar usuário por nome ou email..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full mb-6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#7ED957]"
      />

      {loading ? (
        <p>Carregando usuários...</p>
      ) : usuariosFiltrados.length === 0 ? (
        <p className="text-gray-500">Nenhum usuário encontrado.</p>
      ) : (
        usuariosFiltrados.map((usuario) => (
          <div
            key={usuario.id}
            className="mb-4 flex justify-between items-center bg-white p-4 rounded shadow"
          >
            <div>
              <h3 className="font-semibold">{usuario.nome}</h3>
              <p className="text-gray-600 text-sm">{usuario.email}</p>
            </div>
            <button
              onClick={() => carregarPermissoes(usuario)}
              className="bg-[#7ED957] text-white px-4 py-2 rounded hover:bg-green-600 font-semibold"
            >
              Editar Permissões
            </button>
          </div>
        ))
      )}

      {usuarioSelecionado && permissoesUsuario && (
        <ModalPermissoes
          usuario={usuarioSelecionado}
          permissoesIniciais={permissoesUsuario}
          onClose={() => {
            setUsuarioSelecionado(null);
            setPermissoesUsuario(null);
          }}
          onSave={async (permissoesAtualizadas) => {
            await salvarPermissoes(
              usuarioSelecionado.id,
              permissoesAtualizadas
            );
            setUsuarioSelecionado(null);
            setPermissoesUsuario(null);
          }}
        />
      )}
    </div>
  );
}
