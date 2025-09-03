// src/pages/admin/CadastroEmpresa.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import EmpresaCard from "../../components/EmpresaCard";
import EmpresaForm from "../../components/EmpresaForm";
import ModalVisualizarEmpresa from "../../components/ModalVisualizarEmpresa";

export default function CadastroEmpresa() {
  const { apiCliente } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaVisualizar, setEmpresaVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const { data } = await apiCliente.get("/empresa");
      setEmpresa(data || null);
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
      alert(err?.response?.data?.error || "Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirFormulario = () => {
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setEmpresaVisualizar(null);
    carregar();
  };

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
        <div className="flex gap-2">
          <button
            onClick={abrirFormulario}
            className="bg-[#7ED957] text-white px-6 py-2 rounded mt-2 hover:bg-[#65b344]"
          >
            {empresa ? "Editar Empresa" : "Cadastrar Empresa"}
          </button>

          <button
            onClick={async () => {
              try {
                await apiCliente.post("/empresa/importar-admin");
                alert("Empresa importada do admin!");
                carregar();
              } catch (e) {
                alert(e?.response?.data?.error || "Erro ao importar do admin");
              }
            }}
            className="px-6 py-2 border rounded mt-2"
          >
            Reimportar do Admin
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
