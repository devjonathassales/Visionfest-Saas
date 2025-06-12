import React, { useState, useEffect } from 'react';

export default function ClienteForm({ onSave, clienteSelecionado, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    celular: '',
    dataNascimento: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    if (clienteSelecionado) {
      setFormData(clienteSelecionado);
    }
  }, [clienteSelecionado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nome, cpf, whatsapp, email } = formData;
    if (!nome || !cpf || !whatsapp || !email) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    onSave(formData);
  };

  const InputField = ({ label, name, type = 'text', required = false }) => (
    <div className="w-full">
      <label className="block mb-1 text-sm font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        className="input"
      />
    </div>
  );

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-5xl mx-auto">
      <h2 className="text-2xl font-montserrat text-primary mb-6">
        {clienteSelecionado ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Nome */}
        <div className="flex flex-col md:flex-row gap-4">
          <InputField label="Nome*" name="nome" required />
        </div>

        {/* WhatsApp, Celular, Email */}
        <div className="flex flex-col md:flex-row gap-4">
          <InputField label="WhatsApp*" name="whatsapp" required />
          <InputField label="Celular" name="celular" />
          <InputField label="Email*" name="email" required />
        </div>

        {/* CPF, Data de Nascimento */}
        <div className="flex flex-col md:flex-row gap-4">
          <InputField label="CPF*" name="cpf" required />
          <InputField label="Data de Nascimento" name="dataNascimento" type="date" />
        </div>

        {/* CEP, Logradouro, Número */}
        <div className="flex flex-col md:flex-row gap-4">
          <InputField label="CEP" name="cep" />
          <InputField label="Logradouro" name="logradouro" />
          <InputField label="Número" name="numero" />
        </div>

        {/* Complemento, Bairro, Cidade, Estado - mesma linha */}
        <div className="flex flex-col md:flex-row gap-4">
          <InputField label="Complemento" name="complemento" />
          <InputField label="Bairro" name="bairro" />
          <InputField label="Cidade" name="cidade" />
          <InputField label="Estado" name="estado" />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-black rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded"
          >
            {clienteSelecionado ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
