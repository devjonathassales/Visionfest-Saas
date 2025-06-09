import React, { useState } from "react";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import PageHeader from "../components/PageHeader";

export default function ClientForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Cliente cadastrado:", formData);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Cadastro de Clientes"
        subtitle="Adicione ou edite as informações de seus clientes"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Cadastros", path: "/cadastros" },
          { label: "Clientes" },
        ]}
      />
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <InputField
          label="Nome"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <InputField
          label="E-mail"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        <InputField
          label="Telefone"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <InputField
          label="Empresa"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
        />
        <PrimaryButton type="submit">Salvar Cliente</PrimaryButton>
      </form>
    </div>
  );
}
