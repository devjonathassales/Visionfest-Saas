import React, { useState, useEffect } from "react";
import Stepper from "./Stepper";
import Step1Empresa from "./Step1Empresa";
import Step2SuperAdmin from "./Step2SuperAdmin";
import Step3PlanoPagamento from "./Step3PlanoPagamento";
import api from "../../utils/api";

export default function CadastroWizard() {
  const [step, setStep] = useState(1);

  // Dados da empresa
  const [empresa, setEmpresa] = useState({
    nome: "",
    cpfCnpj: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    whatsapp: "",
    instagram: "",
    emailContato: "",
    dominio: "",
    logo: null,
  });

  // Dados do super admin
  const [superAdmin, setSuperAdmin] = useState({
    usuario: "",
    senha: "",
    confirmarSenha: "",
  });

  // Planos e pagamento
  const [planos, setPlanos] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const [loading, setLoading] = useState(false);

  // 🔥 Buscar planos no backend
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const res = await api.get("/planos");
        setPlanos(res.data);
      } catch (err) {
        console.warn("Erro ao buscar planos. Usando mock.");
        setPlanos([
          { id: 1, nome: "Plano Básico", valor: 49.9 },
          { id: 2, nome: "Plano Profissional", valor: 99.9 },
          { id: 3, nome: "Plano Premium", valor: 199.9 },
        ]);
      }
    }
    fetchPlanos();
  }, []);

  // 🛡️ Validação simples
  function validarStepAtual() {
    if (step === 1) {
      return (
        empresa.nome?.trim() &&
        empresa.cpfCnpj?.trim() &&
        empresa.whatsapp?.trim() &&
        empresa.emailContato?.trim() &&
        empresa.dominio?.trim()
      );
    }
    if (step === 2) {
      return (
        superAdmin.usuario?.trim() &&
        superAdmin.senha?.trim() &&
        superAdmin.confirmarSenha?.trim() &&
        superAdmin.senha === superAdmin.confirmarSenha
      );
    }
    if (step === 3) {
      return planoSelecionado && formaPagamento;
    }
    return false;
  }

  function nextStep() {
    if (validarStepAtual()) {
      setStep(step + 1);
    } else {
      alert("Preencha corretamente os campos obrigatórios.");
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function onSubmit() {
    if (!validarStepAtual()) {
      alert("Preencha corretamente os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Empresa
      Object.entries(empresa).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      // SuperAdmin
      formData.append("usuarioSuperAdmin", superAdmin.usuario);
      formData.append("senhaSuperAdmin", superAdmin.senha);

      // Plano e pagamento
      formData.append("planoId", planoSelecionado);
      formData.append("formaPagamento", formaPagamento);

      // 📡 POST para backend
      await api.post("/empresas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Cadastro realizado com sucesso!");
      setStep(1);
      setEmpresa({
        nome: "",
        cpfCnpj: "",
        cep: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        whatsapp: "",
        instagram: "",
        emailContato: "",
        dominio: "",
        logo: null,
      });
      setSuperAdmin({ usuario: "", senha: "", confirmarSenha: "" });
      setPlanoSelecionado("");
      setFormaPagamento("");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md mt-10">
      <Stepper currentStep={step} totalSteps={3} />

      {step === 1 && <Step1Empresa empresa={empresa} setEmpresa={setEmpresa} />}
      {step === 2 && (
        <Step2SuperAdmin
          superAdmin={superAdmin}
          setSuperAdmin={setSuperAdmin}
        />
      )}
      {step === 3 && (
        <Step3PlanoPagamento
          planos={planos}
          planoSelecionado={planoSelecionado}
          setPlanoSelecionado={setPlanoSelecionado}
          formaPagamento={formaPagamento}
          setFormaPagamento={setFormaPagamento}
        />
      )}

      <div className="flex justify-between mt-8">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Voltar
          </button>
        )}
        {step < 3 && (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Próximo
          </button>
        )}
        {step === 3 && (
          <button
            onClick={onSubmit}
            disabled={loading}
            className={`px-6 py-2 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Enviando..." : "Finalizar Cadastro"}
          </button>
        )}
      </div>
    </div>
  );
}
