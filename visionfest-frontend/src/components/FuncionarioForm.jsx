import React, { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";

export default function FuncionarioForm({
  onSave,
  funcionarioSelecionado,
  onCancel,
}) {
  const initial = {
    nome: "",
    rg: "",
    cpf: "",
    dataNascimento: "",
    estadoCivil: "",
    filhos: false,
    filhosQtd: "",
    whatsapp: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    banco: "",
    agencia: "",
    conta: "",
    pixTipo: "",
    pixChave: "",
    salario: "",
    dataAdmissao: "",
    dataDemissao: "",
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (funcionarioSelecionado) setForm(funcionarioSelecionado);
  }, [funcionarioSelecionado]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "filhos" && !checked ? { filhosQtd: "" } : {}),
    }));
  };

  const validar = () => {
    const er = {};
    if (!form.nome.trim()) er.nome = "Obrigatório";
    if (!form.cpf.trim()) er.cpf = "Obrigatório";
    if (!form.dataAdmissao.trim()) er.dataAdmissao = "Obrigatório";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md space-y-6"
    >
      {/* Campos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block">Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            className={`input w-full ${
              errors.nome ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        <div>
          <label>RG</label>
          <input
            name="rg"
            value={form.rg}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>CPF *</label>
          <IMaskInput
            name="cpf"
            mask="000.000.000-00"
            value={form.cpf}
            onAccept={(value) => setForm((f) => ({ ...f, cpf: value }))}
            className={`input w-full ${
              errors.cpf ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        <div>
          <label>Data Nasc.</label>
          <input
            name="dataNascimento"
            type="date"
            value={form.dataNascimento}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Estado Civil</label>
          <select
            name="estadoCivil"
            value={form.estadoCivil}
            onChange={handleChange}
            className="input w-full"
          >
            <option value="">--</option>
            <option>Solteiro(a)</option>
            <option>Casado(a)</option>
            <option>Divorciado(a)</option>
            <option>Viúvo(a)</option>
          </select>
        </div>
        <div>
          <label>Filhos?</label>
          <input
            name="filhos"
            type="checkbox"
            checked={form.filhos}
            onChange={handleChange}
          />
        </div>
        {form.filhos && (
          <div>
            <label>Número de filhos</label>
            <input
              name="filhosQtd"
              type="number"
              value={form.filhosQtd}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        )}
      </div>

      {/* Contato e endereço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>WhatsApp</label>
          <IMaskInput
            name="whatsapp"
            mask="(00) 00000-0000"
            value={form.whatsapp}
            onAccept={(value) => setForm((f) => ({ ...f, whatsapp: value }))}
            className="input w-full"
          />
        </div>
        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>CEP</label>
          <IMaskInput
            name="cep"
            mask="00000-000"
            value={form.cep}
            onAccept={(value) => setForm((f) => ({ ...f, cep: value }))}
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Logradouro</label>
          <input
            name="logradouro"
            value={form.logradouro}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Número</label>
          <input
            name="numero"
            value={form.numero}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Bairro</label>
          <input
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Cidade</label>
          <input
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Estado</label>
          <input
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      </div>

      {/* Bancários: Banco, Agência e Conta na mesma linha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Banco</label>
          <input
            name="banco"
            value={form.banco}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Agência</label>
          <input
            name="agencia"
            value={form.agencia}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label>Conta</label>
          <input
            name="conta"
            value={form.conta}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      </div>

      {/* PIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Tipo chave Pix</label>
          <select
            name="pixTipo"
            value={form.pixTipo}
            onChange={handleChange}
            className="input w-full"
          >
            <option value="">--</option>
            <option value="cpf">CPF</option>
            <option value="email">Email</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Chave Aleatória</option>
          </select>
        </div>
        <div>
          <label>Chave Pix</label>
          <input
            name="pixChave"
            value={form.pixChave}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      </div>

      {/* Salário com máscara */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div>
          <label>Salário</label>
          <IMaskInput
            name="salario"
            mask={Number}
            scale={2}
            thousandsSeparator="."
            padFractionalZeros={true}
            radix=","
            mapToRadix={["."]}
            normalizeZeros={true}
            min={0}
            onAccept={(value) =>
              setForm((f) => ({ ...f, salario: value ? `R$ ${value}` : "" }))
            }
            value={form.salario.replace("R$ ", "")}
            className="input w-full"
          />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Data Admissão *</label>
          <input
            name="dataAdmissao"
            type="date"
            value={form.dataAdmissao}
            onChange={handleChange}
            className={`input w-full ${
              errors.dataAdmissao ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        <div>
          <label>Data Demissão</label>
          <input
            name="dataDemissao"
            type="date"
            value={form.dataDemissao}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[#c0c0c0] text-gray-700 rounded hover:bg-gray-400 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#7ed957] text-white rounded hover:bg-green-700 transition"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}