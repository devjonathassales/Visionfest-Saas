import React, { useEffect, useRef, useState } from "react";
import IMask from "imask";

export default function FuncionarioForm({
  onSave,
  funcionarioSelecionado,
  onCancel,
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    funcao: "",
    cpf: "",
    whatsapp: "",
    rg: "",
    dataNascimento: "",
    estadoCivil: "",
    filhos: false,
    filhosQtd: "",
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
  });
  const [errors, setErrors] = useState({});

  const cpfRef = useRef(null);
  const whatsappRef = useRef(null);
  const cepRef = useRef(null);
  const maskRefs = useRef({});

  // máscaras
  useEffect(() => {
    if (cpfRef.current) {
      maskRefs.current.cpf = IMask(cpfRef.current, {
        mask: "000.000.000-00",
        lazy: false,
      }).on("accept", () =>
        setForm((p) => ({ ...p, cpf: maskRefs.current.cpf.value }))
      );
    }
    if (whatsappRef.current) {
      maskRefs.current.whatsapp = IMask(whatsappRef.current, {
        mask: [{ mask: "(00) 00000-0000" }, { mask: "(00) 0000-0000" }],
        dispatch: (a, m) =>
          (m.value + a).replace(/\D/g, "").length > 10
            ? m.compiledMasks[0]
            : m.compiledMasks[1],
      }).on("accept", () =>
        setForm((p) => ({ ...p, whatsapp: maskRefs.current.whatsapp.value }))
      );
    }
    if (cepRef.current) {
      maskRefs.current.cep = IMask(cepRef.current, {
        mask: "00000-000",
        lazy: false,
      }).on("accept", () =>
        setForm((p) => ({ ...p, cep: maskRefs.current.cep.value }))
      );
    }
    return () => {
      Object.values(maskRefs.current).forEach((m) => m?.destroy?.());
      maskRefs.current = {};
    };
  }, []);

  // preencher em edição
  useEffect(() => {
    if (funcionarioSelecionado) {
      setForm({ ...form, ...funcionarioSelecionado });
      setTimeout(() => {
        if (maskRefs.current.cpf) {
          maskRefs.current.cpf.value = funcionarioSelecionado.cpf || "";
          maskRefs.current.cpf.updateValue();
        }
        if (maskRefs.current.whatsapp) {
          maskRefs.current.whatsapp.value =
            funcionarioSelecionado.whatsapp || "";
          maskRefs.current.whatsapp.updateValue();
        }
        if (maskRefs.current.cep) {
          maskRefs.current.cep.value = funcionarioSelecionado.cep || "";
          maskRefs.current.cep.updateValue();
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcionarioSelecionado]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validarCPF = (str) => {
    const cpf = (str || "").replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0,
      resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.email.trim()) e.email = "Email é obrigatório";
    if (form.cpf && !validarCPF(form.cpf)) e.cpf = "CPF inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validar()) return;

    const payload = {
      ...form,
      cpf: (form.cpf || "").replace(/\D/g, ""),
      whatsapp: (form.whatsapp || "").replace(/\D/g, ""),
      filhosQtd: form.filhos ? Number(form.filhosQtd || 0) : 0,
    };
    if (!form.filhos) payload.filhosQtd = 0;

    onSave(payload);
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            className={`input w-full ${
              errors.nome ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.nome && (
            <p className="text-red-600 text-sm mt-1">{errors.nome}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={`input w-full ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1">Função</label>
          <input
            name="funcao"
            value={form.funcao}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1">CPF</label>
          <input
            ref={cpfRef}
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            className={`input w-full ${
              errors.cpf ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.cpf && (
            <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1">WhatsApp</label>
          <input
            ref={whatsappRef}
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">RG</label>
          <input
            name="rg"
            value={form.rg}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Data de Nascimento</label>
          <input
            name="dataNascimento"
            type="date"
            value={form.dataNascimento}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1">Estado Civil</label>
          <input
            name="estadoCivil"
            value={form.estadoCivil}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="filhos"
              checked={form.filhos}
              onChange={handleChange}
            />
            Tem filhos?
          </label>
        </div>
        <div>
          <label className="block font-semibold mb-1">Qtd. Filhos</label>
          <input
            name="filhosQtd"
            type="number"
            min="0"
            value={form.filhosQtd}
            onChange={handleChange}
            disabled={!form.filhos}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1">CEP</label>
          <input
            ref={cepRef}
            name="cep"
            value={form.cep}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Logradouro</label>
          <input
            name="logradouro"
            value={form.logradouro}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Número</label>
          <input
            name="numero"
            value={form.numero}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Bairro</label>
          <input
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">Cidade</label>
          <input
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Estado</label>
          <input
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Salário</label>
          <input
            name="salario"
            type="number"
            step="0.01"
            value={form.salario}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1">Banco</label>
          <input
            name="banco"
            value={form.banco}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Agência</label>
          <input
            name="agencia"
            value={form.agencia}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Conta</label>
          <input
            name="conta"
            value={form.conta}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tipo Pix</label>
          <input
            name="pixTipo"
            value={form.pixTipo}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">Chave Pix</label>
          <input
            name="pixChave"
            value={form.pixChave}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Admissão</label>
          <input
            name="dataAdmissao"
            type="date"
            value={form.dataAdmissao}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Demissão</label>
          <input
            name="dataDemissao"
            type="date"
            value={form.dataDemissao}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
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
