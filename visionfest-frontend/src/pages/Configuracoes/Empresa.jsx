// src/pages/Configuracoes/Empresa.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import apiClienteFallback from "/src/utils/apiCliente.js";

export default function Empresa() {
  const auth = useAuth?.() || null;
  const api = auth?.api || auth?.apiCliente || apiClienteFallback;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [showView, setShowView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // campos de edição
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    whatsapp: "",
    telefone: "",
    email: "",
    instagram: "",
  });
  const [logoFile, setLogoFile] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const { data } = await api.get("/empresa"); // baseURL já tem /api
      setEmpresa(data || {});
      setForm({
        nome: data?.nome || "",
        documento: data?.documento || "",
        whatsapp: data?.whatsapp || "",
        telefone: data?.telefone || "",
        email: data?.email || "",
        instagram: data?.instagram || "",
      });
    } catch (e) {
      setErro(
        e?.response?.data?.error || e?.message || "Erro ao carregar empresa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImportAdmin = async () => {
    try {
      await api.post("/empresa/importar-admin");
      await carregar();
    } catch (e) {
      alert(
        e?.response?.data?.error || e?.message || "Falha ao reimportar do admin"
      );
    }
  };

  const handleSyncFinanceiro = async () => {
    try {
      await api.post("/empresa/importar-financeiro");
      alert("Sincronização solicitada.");
    } catch (e) {
      alert(
        e?.response?.data?.error ||
          e?.message ||
          "Erro ao sincronizar financeiro"
      );
    }
  };

  const salvar = async (ev) => {
    ev.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (logoFile) fd.append("logo", logoFile);

      await api.put("/empresa", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsEditing(false);
      setLogoFile(null);
      await carregar();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Erro ao salvar");
    }
  };

  const campo = (name, label, type = "text") => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={form[name] || ""}
        onChange={(e) => setForm((s) => ({ ...s, [name]: e.target.value }))}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );

  if (loading) return <p>Carregando…</p>;
  if (erro) return <p className="text-red-600">{erro}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-6">Dados da Empresa</h1>

      {/* header, ações */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-lime-500 text-white rounded-lg"
        >
          Editar Empresa
        </button>
        <button
          onClick={handleImportAdmin}
          className="px-4 py-2 bg-gray-100 rounded-lg"
        >
          Reimportar do Admin
        </button>
        <button
          onClick={handleSyncFinanceiro}
          className="px-4 py-2 bg-gray-100 rounded-lg"
        >
          Sincronizar Financeiro
        </button>
        <button
          onClick={() => setShowView(true)}
          className="ml-auto px-4 py-2 bg-gray-200 rounded-lg"
        >
          Visualizar
        </button>
      </div>

      {/* resumo */}
      <div className="text-sm">
        <div className="font-semibold">{empresa?.nome || "—"}</div>
        <div>CNPJ/CPF: {empresa?.documento || "—"}</div>
        <div>Whatsapp: {empresa?.whatsapp || "—"}</div>
      </div>

      {/* modal visualizar */}
      {showView && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[640px]">
            <h2 className="text-xl font-bold mb-4">Detalhes da Empresa</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold">Nome:</div>
                <div>{empresa?.nome || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Documento:</div>
                <div>{empresa?.documento || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Email:</div>
                <div>{empresa?.email || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Telefone:</div>
                <div>{empresa?.telefone || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Whatsapp:</div>
                <div>{empresa?.whatsapp || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Instagram:</div>
                <div>{empresa?.instagram || "—"}</div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowView(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* formulário edição */}
      {isEditing && (
        <form onSubmit={salvar} className="mt-6 grid grid-cols-2 gap-4">
          {campo("nome", "Nome da Empresa")}
          {campo("documento", "CPF ou CNPJ")}
          {campo("whatsapp", "Whatsapp")}
          {campo("telefone", "Telefone")}
          {campo("email", "E-mail", "email")}
          {campo("instagram", "Instagram")}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Logomarca</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="col-span-2 mt-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-lime-600 text-white rounded-lg"
            >
              Salvar Empresa
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setLogoFile(null);
                setForm({
                  nome: empresa?.nome || "",
                  documento: empresa?.documento || "",
                  whatsapp: empresa?.whatsapp || "",
                  telefone: empresa?.telefone || "",
                  email: empresa?.email || "",
                  instagram: empresa?.instagram || "",
                });
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
