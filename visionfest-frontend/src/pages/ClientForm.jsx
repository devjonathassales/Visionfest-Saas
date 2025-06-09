import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputField from "../components/InputField";
import MaskedInputField from "../components/MaskedInputField"; // com react-imask
import PrimaryButton from "../components/PrimaryButton";
import PageHeader from "../components/PageHeader";
import { isValidCpf } from "../utils/validateCpf";
import { estados } from "../data/estados";
import { paises } from "../data/paises";

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    whatsapp: "",
    telefone: "",
    nascimento: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const mockCliente = {
        nome: "Carlos Lima",
        cpf: "123.456.789-09",
        whatsapp: "(85) 98888-5678",
        telefone: "(85) 3222-4455",
        nascimento: "1985-03-15",
        email: "carlos@email.com",
        cep: "60111-110",
        logradouro: "Rua das Flores",
        numero: "123",
        bairro: "Aldeota",
        cidade: "Fortaleza",
        estado: "CE",
        pais: "Brasil",
      };
      setFormData(mockCliente);
    }
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCepBlur() {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            logradouro: "",
            bairro: "",
            cidade: "",
            estado: "",
          }));
          alert("CEP não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      }
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";

    const cpfClean = formData.cpf.replace(/\D/g, "");
    if (!cpfClean || !isValidCpf(cpfClean)) newErrors.cpf = "CPF inválido";

    if (!formData.whatsapp.trim()) newErrors.whatsapp = "WhatsApp é obrigatório";

    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.estado.trim()) newErrors.estado = "Estado é obrigatório";
    if (!formData.pais.trim()) newErrors.pais = "País é obrigatório";

    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      const field = document.getElementsByName(firstErrorField)[0];
      if (field) field.focus();
    } else {
      setErrors({});
      console.log(id ? "Cliente atualizado:" : "Cliente criado:", formData);
      alert(`Cliente ${id ? "atualizado" : "criado"} com sucesso!`);
      navigate("/cadastros");
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={id ? "Editar Cliente" : "Cadastro de Cliente"}
        subtitle={
          id
            ? "Atualize os dados do cliente"
            : "Preencha os dados para criar um cliente"
        }
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Cadastros", path: "/cadastros" },
          { label: id ? "Editar Cliente" : "Novo Cliente" },
        ]}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md space-y-4"
      >
        <InputField
          label="Nome"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          error={errors.nome}
        />

        <MaskedInputField
          label="CPF"
          id="cpf"
          name="cpf"
          mask="000.000.000-00"
          value={formData.cpf}
          onChange={handleChange}
          required
          error={errors.cpf}
        />

        <MaskedInputField
          label="WhatsApp"
          id="whatsapp"
          name="whatsapp"
          mask="(00) 00000-0000"
          value={formData.whatsapp}
          onChange={handleChange}
          required
          error={errors.whatsapp}
        />

        <MaskedInputField
          label="Telefone"
          id="telefone"
          name="telefone"
          mask="(00) 00000-0000"
          value={formData.telefone}
          onChange={handleChange}
        />

        <InputField
          label="Data de Nascimento"
          id="nascimento"
          name="nascimento"
          type="date"
          value={formData.nascimento}
          onChange={handleChange}
        />

        <InputField
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          error={errors.email}
        />

        <MaskedInputField
          label="CEP"
          id="cep"
          name="cep"
          mask="00000-000"
          value={formData.cep}
          onChange={handleChange}
          onBlur={handleCepBlur}
        />

        <InputField
          label="Logradouro"
          id="logradouro"
          name="logradouro"
          value={formData.logradouro}
          onChange={handleChange}
        />

        <InputField
          label="Número"
          id="numero"
          name="numero"
          value={formData.numero}
          onChange={handleChange}
        />

        <InputField
          label="Bairro"
          id="bairro"
          name="bairro"
          value={formData.bairro}
          onChange={handleChange}
        />

        <InputField
          label="Cidade"
          id="cidade"
          name="cidade"
          value={formData.cidade}
          onChange={handleChange}
        />

        <div className="mb-4">
          <label className="block text-sm font-montserrat text-black mb-1">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
            className={`w-full border rounded px-3 py-2 text-sm font-opensans focus:outline-none focus:ring-2 ${
              errors.estado
                ? "border-red-500 focus:ring-red-500"
                : "border-silver focus:ring-primary"
            }`}
          >
            <option value="">Selecione</option>
            {estados.map((est) => (
              <option key={est.sigla} value={est.sigla}>
                {est.nome}
              </option>
            ))}
          </select>
          {errors.estado && (
            <p className="text-red-500 text-xs mt-1">{errors.estado}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-montserrat text-black mb-1">
            País <span className="text-red-500">*</span>
          </label>
          <select
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            required
            className={`w-full border rounded px-3 py-2 text-sm font-opensans focus:outline-none focus:ring-2 ${
              errors.pais
                ? "border-red-500 focus:ring-red-500"
                : "border-silver focus:ring-primary"
            }`}
          >
            <option value="">Selecione</option>
            {paises.map((pais) => (
              <option key={pais.codigo} value={pais.nome}>
                {pais.nome}
              </option>
            ))}
          </select>
          {errors.pais && (
            <p className="text-red-500 text-xs mt-1">{errors.pais}</p>
          )}
        </div>

        <PrimaryButton type="submit">
          {id ? "Atualizar Cliente" : "Cadastrar Cliente"}
        </PrimaryButton>
      </form>
    </div>
  );
}
