import React, { useState, useEffect } from "react";
import ModalPermissoes from "../../components/ModalPermissoes";

const API_BASE = "http://localhost:5000/api";

export default function PermissoesPage() {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissoesUsuario, setPermissoesUsuario] = useState(null);

  // Carrega usuários do backend
  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios`);
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carrega permissões ao abrir modal
  const carregarPermissoes = async (usuario) => {
    try {
      const res = await fetch(`${API_BASE}/permissoes/${usuario.id}`);
      if (!res.ok) throw new Error("Erro ao carregar permissões do usuário");
      const data = await res.json();
      setPermissoesUsuario(data.permissoes || {}); // garantir estrutura
      setUsuarioSelecionado(usuario);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Filtra usuários conforme texto digitado
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = filtro.toLowerCase();
    return (
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo)
    );
  });

  // Salva permissões via API
  const salvarPermissoes = async (usuarioId, permissoesAtualizadas) => {
    try {
      const res = await fetch(`${API_BASE}/permissoes/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissoes: permissoesAtualizadas }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar permissões");
      }
      alert("Permissões salvas com sucesso!");
    } catch (err) {
      alert(err.message);
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
