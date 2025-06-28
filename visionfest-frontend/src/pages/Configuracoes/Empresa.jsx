import React, { useEffect, useState } from "react";
import EmpresaCard from "../../components/EmpresaCard";
import EmpresaForm from "../../components/EmpresaForm";
import ModalVisualizarEmpresa from "../../components/ModalVisualizarEmpresa";

const API_BASE = "http://localhost:5000/api";

export default function CadastroEmpresa() {
  const [empresas, setEmpresas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [empresaVisualizar, setEmpresaVisualizar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/empresa/todas`);
      if (!res.ok) throw new Error("Erro ao carregar empresas");
      const data = await res.json();
      setEmpresas(data || []);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
      alert("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const abrirFormulario = (empresa = null) => {
    setEmpresaSelecionada(
      empresa || {
        nome: "",
        documento: "",
        whatsapp: "",
        telefone: "",
        email: "",
        instagram: "",
        logo: null,
        enderecos: [
          {
            logradouro: "",
            numero: "",
            bairro: "",
            cidade: "",
            estado: "",
            cep: "",
            padrao: true,
          },
        ],
      }
    );
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setMostrarFormulario(false);
    setEmpresaSelecionada(null);
    carregarEmpresas();
  };

  const excluirEmpresa = async (empresa) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a empresa "${empresa.nome}"?`
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE}/empresa/${empresa.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao excluir empresa");

      alert("Empresa excluída com sucesso!");
      carregarEmpresas();
    } catch (err) {
      console.error("Erro ao excluir empresa:", err);
      alert(err.message || "Erro ao excluir empresa");
    }
  };

  return (
    <div className="p-6 font-open max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6">
        Empresas Cadastradas
      </h1>

      {loading && <p>Carregando empresas...</p>}

      {!loading && empresas.length === 0 && (
        <p className="text-gray-500 mb-4">Nenhuma empresa cadastrada ainda.</p>
      )}

      {!loading &&
        empresas.map((empresa, i) => (
          <EmpresaCard
            key={empresa.id || i}
            empresa={empresa}
            onEditar={() => abrirFormulario(empresa)}
            onVisualizar={() => setEmpresaVisualizar(empresa)}
            onExcluir={() => excluirEmpresa(empresa)}
          />
        ))}

      {!mostrarFormulario && (
        <button
          onClick={() => abrirFormulario()}
          className="bg-[#7ED957] text-white px-6 py-2 rounded mt-4 hover:bg-[#65b344]"
        >
          Cadastrar Empresa
        </button>
      )}

      {mostrarFormulario && empresaSelecionada && (
        <EmpresaForm
          empresa={empresaSelecionada}
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
