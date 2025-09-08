// src/pages/admin/CadastroEmpresa.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import EmpresaCard from "../../components/EmpresaCard";
import EmpresaForm from "../../components/EmpresaForm";
import ModalVisualizarEmpresa from "../../components/ModalVisualizarEmpresa";

export default function CadastroEmpresa() {
  const { api, apiCliente } = useAuth();
  const http = api || apiCliente;

  const [empresa, setEmpresa] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaVisualizar, setEmpresaVisualizar] = useState(null);

  const [loading, setLoading] = useState(false);
  const [importingAdmin, setImportingAdmin] = useState(false);
  const [importingFin, setImportingFin] = useState(false);

  const carregar = useCallback(async () => {
    if (!http) return;
    setLoading(true);
    try {
      // ✅ rota correta do tenant (o app.js monta em /api/empresa e a route expõe /empresa)
      const { data } = await http.get("/empresa");
      setEmpresa(data || null);
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
      alert(err?.response?.data?.error || "Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  }, [http]);

  useEffect(() => {
    if (http) carregar();
  }, [http, carregar]);

  const abrirFormulario = () => setMostrarFormulario(true);

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setEmpresaVisualizar(null);
    carregar();
  };

  async function handleImportAdmin() {
    if (!http) return;
    setImportingAdmin(true);
    try {
      await http.post("/empresa/importar-admin");
      alert("Empresa importada/atualizada a partir do Admin com sucesso!");
      await carregar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Erro ao importar do admin");
    } finally {
      setImportingAdmin(false);
    }
  }

  async function handleImportFinanceiro() {
    if (!http) return;
    setImportingFin(true);
    try {
      const { data } = await http.post("/empresa/importar-financeiro");
      // Monta um resumo amigável do resultado
      const cr = data?.contasReceber || {};
      const ft = data?.faturas || {};
      const resumo =
        `Financeiro sincronizado!\n\n` +
        `Contas a Receber — importados: ${cr.imported ?? 0}, atualizados: ${
          cr.updated ?? 0
        }\n` +
        `Faturas — importadas: ${ft.imported ?? 0}, atualizadas: ${
          ft.updated ?? 0
        }, itens recriados: ${ft.items ?? 0}`;
      alert(resumo);
      await carregar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Erro ao importar financeiro do admin");
    } finally {
      setImportingFin(false);
    }
  }

  return (
    <div className="p-6 font-open max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6">
        Dados da Empresa
      </h1>

      {loading && <p>Carregando...</p>}

      {!loading && empresa && !mostrarFormulario && (
        <EmpresaCard
          empresa={empresa}
          onEditar={abrirFormulario}
          onVisualizar={() => setEmpresaVisualizar(empresa)}
          onExcluir={null /* não aplicável no tenant */}
        />
      )}

      {!loading && !empresa && !mostrarFormulario && (
        <div className="text-gray-600 mb-4">
          Nenhuma empresa registrada no tenant ainda.
        </div>
      )}

      {!mostrarFormulario && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={abrirFormulario}
            disabled={loading || importingAdmin || importingFin}
            className="bg-[#7ED957] text-white px-6 py-2 rounded mt-2 hover:bg-[#65b344] disabled:opacity-60"
          >
            {empresa ? "Editar Empresa" : "Cadastrar Empresa"}
          </button>

          <button
            onClick={handleImportAdmin}
            disabled={!http || loading || importingAdmin || importingFin}
            className="px-6 py-2 border rounded mt-2 disabled:opacity-60"
            title="Importa/atualiza os dados da empresa do Admin para este tenant"
          >
            {importingAdmin ? "Importando do Admin..." : "Reimportar do Admin"}
          </button>

          <button
            onClick={handleImportFinanceiro}
            disabled={!http || loading || importingFin || importingAdmin}
            className="px-6 py-2 border rounded mt-2 disabled:opacity-60"
            title="Espelha Contas a Receber e Faturas do Admin para o tenant"
          >
            {importingFin
              ? "Sincronizando financeiro..."
              : "Sincronizar Financeiro"}
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <EmpresaForm
          empresa={empresa}
          onCancelar={fecharFormulario}
          onSalvar={fecharFormulario}
        />
      )}

      {empresaVisualizar && (
        <ModalVisualizarEmpresa
          empresa={empresaVisualizar}
          onClose={() => setEmpresaVisualizar(null)}
        />
      )}
    </div>
  );
}
