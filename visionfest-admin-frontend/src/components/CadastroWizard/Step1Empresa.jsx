import React from "react";

export default function Step1Empresa({ empresa, setEmpresa }) {
  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setEmpresa((prev) => ({ ...prev, logo: files[0] }));
    } else {
      setEmpresa((prev) => ({ ...prev, [name]: value }));
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados da Empresa</h2>
      <input
        name="nome"
        placeholder="Nome da Empresa *"
        value={empresa.nome}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="cpfCnpj"
        placeholder="CNPJ/CPF *"
        value={empresa.cpfCnpj}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="dominio"
        placeholder="Domínio (ex: minhaempresa)"
        value={empresa.dominio}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <input
        name="whatsapp"
        placeholder="WhatsApp *"
        value={empresa.whatsapp}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="emailContato"
        placeholder="E-mail de Contato *"
        type="email"
        value={empresa.emailContato}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <label className="block">
        Logo da Empresa:
        <input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleChange}
          className="mt-1 block"
        />
      </label>
    </div>
  );
}
