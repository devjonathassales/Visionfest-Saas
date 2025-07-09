import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function UsuarioModal({ usuario, onClose, onSuccess, permissoesDisponiveis }) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    ativo: true,
    permissoes: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        senha: "",
        ativo: usuario.ativo,
        permissoes: usuario.permissoes || {},
      });
    } else {
      setForm({
        nome: "",
        email: "",
        senha: "",
        ativo: true,
        permissoes: {},
      });
    }
  }, [usuario]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "ativo") {
      setForm((f) => ({ ...f, ativo: checked }));
      return;
    }

    if (name.startsWith("perm_")) {
      const key = name.replace("perm_", "");
      setForm((f) => ({
        ...f,
        permissoes: {
          ...f.permissoes,
          [key]: checked,
        },
      }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.nome || !form.email) {
      alert("Nome e e-mail são obrigatórios.");
      return;
    }
    // Se criar usuário novo, senha obrigatória
    if (!usuario && !form.senha) {
      alert("Senha é obrigatória para novo usuário.");
      return;
    }

    try {
      setLoading(true);

      if (usuario) {
        // Editar usuário
        await api.put(`/usuarios/${usuario.id}`, {
          nome: form.nome,
          email: form.email,
          senha: form.senha || undefined, // só envia se informado
          ativo: form.ativo,
          permissoes: form.permissoes,
        });
      } else {
        // Criar usuário
        await api.post("/usuarios", {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          ativo: form.ativo,
          permissoes: form.permissoes,
        });
      }

      alert(`Usuário ${usuario ? "atualizado" : "criado"} com sucesso!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      alert("Erro ao salvar usuário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{usuario ? "Editar Usuário" : "Novo Usuário"}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Nome *</label>
            <input
              name="nome"
              value={form.nome}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">E-mail *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Senha {usuario ? "(Deixe em branco para manter)" : "*"}
            </label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={usuario ? "Senha (opcional)" : ""}
              {...(!usuario ? { required: true } : {})}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={form.ativo}
              onChange={onChange}
              className="w-4 h-4"
            />
            <label htmlFor="ativo" className="select-none text-gray-700 font-semibold">
              Usuário Ativo
            </label>
          </div>

          <fieldset className="border border-gray-300 rounded p-3 max-h-48 overflow-auto">
            <legend className="font-semibold mb-2 text-gray-700">Permissões</legend>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
              {permissoesDisponiveis.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`perm_${key}`}
                    name={`perm_${key}`}
                    checked={!!form.permissoes[key]}
                    onChange={onChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`perm_${key}`} className="select-none text-gray-700">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
