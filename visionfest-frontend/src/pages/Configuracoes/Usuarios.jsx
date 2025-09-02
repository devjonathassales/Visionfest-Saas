import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { FaEdit, FaEye, FaTrash, FaPlus } from "react-icons/fa";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import { useAuth } from "/src/contexts/authContext.jsx";

// Garante o prefixo /api mesmo se o axios não tiver baseURL configurado
function withApiPrefix(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.startsWith("/api/") ? p : `/api${p}`;
}

export default function CadastroUsuarios() {
  const auth = useAuth();
  const axiosClient = useMemo(
    () => auth?.apiCliente || auth?.api || null,
    [auth]
  );

  // Cliente HTTP estável por ref (axios se existir; fallback fetch)
  const httpRef = useRef({
    get: async (path) => {
      const res = await fetch(withApiPrefix(path), { credentials: "include" });
      if (!res.ok) throw new Error(`Falha ao carregar (${res.status})`);
      const data = await res.json().catch(() => []);
      return { data };
    },
    post: async (path, body) => {
      const res = await fetch(withApiPrefix(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Falha ao salvar (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      return { data };
    },
    put: async (path, body) => {
      const res = await fetch(withApiPrefix(path), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Falha ao salvar (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      return { data };
    },
    patch: async (path, body) => {
      const res = await fetch(withApiPrefix(path), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Falha ao atualizar (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      return { data };
    },
    delete: async (path) => {
      const res = await fetch(withApiPrefix(path), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Falha ao excluir (${res.status})`);
      }
      return {};
    },
  });

  // Se existir axios configurado, usa ele (com prefixo /api garantido)
  useEffect(() => {
    if (!axiosClient) return;
    httpRef.current = {
      get: (path) => axiosClient.get(withApiPrefix(path)),
      post: (path, body) => axiosClient.post(withApiPrefix(path), body),
      put: (path, body) => axiosClient.put(withApiPrefix(path), body),
      patch: (path, body) => axiosClient.patch(withApiPrefix(path), body),
      delete: (path) => axiosClient.delete(withApiPrefix(path)),
    };
  }, [axiosClient]);

  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loading, setLoading] = useState(false);

  // Evita o duplo fetch em dev (StrictMode)
  const hasFetchedRef = useRef(false);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await httpRef.current.get("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    carregarUsuarios();
  }, [carregarUsuarios]);

  const abrirFormulario = (usuario = null) => {
    setForm(
      usuario
        ? {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            senha: "",
            confirmarSenha: "",
          }
        : { id: null, nome: "", email: "", senha: "", confirmarSenha: "" }
    );
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setForm({ id: null, nome: "", email: "", senha: "", confirmarSenha: "" });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      (form.senha || form.confirmarSenha) &&
      form.senha !== form.confirmarSenha
    ) {
      alert("As senhas não coincidem.");
      return;
    }
    if (form.senha && form.senha.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      const body = {
        nome: form.nome,
        email: form.email,
      };
      if (form.senha) {
        body.senha = form.senha;
        body.confirmarSenha = form.confirmarSenha;
      }

      if (form.id) {
        await httpRef.current.put(`/usuarios/${form.id}`, body);
      } else {
        await httpRef.current.post(`/usuarios`, body);
      }

      alert("Usuário salvo com sucesso!");
      fecharFormulario();
      await carregarUsuarios();
    } catch (err) {
      alert(err?.message || "Erro ao salvar usuário");
    }
  };

  const toggleAtivo = async (usuario) => {
    try {
      await httpRef.current.patch(`/usuarios/${usuario.id}/ativo`, {
        ativo: !usuario.ativo,
      });
      await carregarUsuarios();
    } catch (err) {
      alert(err?.message || "Erro ao alterar status");
    }
  };

  const excluirUsuario = async (usuario) => {
    if (confirm(`Deseja realmente excluir "${usuario.nome}"?`)) {
      try {
        await httpRef.current.delete(`/usuarios/${usuario.id}`);
        await carregarUsuarios();
      } catch (err) {
        alert(err?.message || "Erro ao excluir usuário");
      }
    }
  };

  const formatarData = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="p-4 md:p-8 font-open max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6">
        Cadastro de Usuários
      </h1>

      {!mostrarFormulario && (
        <button
          onClick={() => abrirFormulario()}
          className="mb-6 bg-[#7ED957] text-white px-6 py-2 rounded hover:bg-green-600 flex items-center gap-2"
        >
          <FaPlus className="text-[18px]" /> Criar Usuário
        </button>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-md p-6 space-y-4 mb-6 max-w-xl"
        >
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Senha{" "}
                {form.id && <span className="text-xs italic">(opcional)</span>}
              </label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                minLength={form.senha ? 6 : undefined}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                name="confirmarSenha"
                value={form.confirmarSenha}
                onChange={handleChange}
                minLength={form.confirmarSenha ? 6 : undefined}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={fecharFormulario}
              className="px-6 py-2 rounded border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#7ED957] hover:bg-green-600 text-white font-semibold px-6 py-2 rounded shadow"
            >
              {form.id ? "Salvar Alterações" : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Carregando usuários...</p>
      ) : usuarios.length > 0 ? (
        <div className="bg-white shadow rounded-md divide-y text-sm">
          <div className="p-4 grid grid-cols-2 md:grid-cols-5 font-semibold border-b border-gray-300 gap-2">
            <div>Nome</div>
            <div className="hidden md:block">E-mail</div>
            <div className="hidden md:block">Data Cadastro</div>
            <div className="hidden md:block">Status</div>
            <div>Ações</div>
          </div>

          {usuarios.map((u) => (
            <div
              key={u.id}
              className="p-4 grid grid-cols-2 md:grid-cols-5 items-center hover:bg-gray-50 gap-2"
            >
              <div>{u.nome}</div>
              <div className="hidden md:block break-all">{u.email}</div>
              <div className="hidden md:block">{formatarData(u.createdAt)}</div>
              <div className="hidden md:block">
                <button
                  onClick={() => toggleAtivo(u)}
                  title={u.ativo ? "Desativar" : "Ativar"}
                >
                  {u.ativo ? (
                    <MdToggleOn className="text-green-600 text-5xl" />
                  ) : (
                    <MdToggleOff className="text-gray-400 text-5xl" />
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => abrirFormulario(u)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <FaEdit className="text-[22px]" />
                </button>
                <button
                  onClick={() =>
                    alert(
                      `Usuário:\nNome: ${u.nome}\nEmail: ${u.email}\nStatus: ${
                        u.ativo ? "Ativo" : "Inativo"
                      }\nCriado em: ${formatarData(u.createdAt)}`
                    )
                  }
                  className="text-gray-600 hover:text-gray-800"
                  title="Visualizar"
                >
                  <FaEye className="text-[22px]" />
                </button>
                <button
                  onClick={() => excluirUsuario(u)}
                  className="text-red-600 hover:text-red-800"
                  title="Excluir"
                >
                  <FaTrash className="text-[22px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Nenhum usuário cadastrado.</p>
      )}
    </div>
  );
}
