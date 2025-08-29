import React, { useState, useEffect, useRef } from "react";
import IMask from "imask";

export default function FornecedorForm({
  onSave,
  fornecedorSelecionado,
  onCancel,
}) {
  const [form, setForm] = useState({
    nome: "",
    cpfCnpj: "",
    endereco: "",
    whatsapp: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const cpfCnpjRef = useRef(null);
  const whatsappRef = useRef(null);

  useEffect(() => {
    if (cpfCnpjRef.current) {
      IMask(cpfCnpjRef.current, {
        mask: [{ mask: "000.000.000-00" }, { mask: "00.000.000/0000-00" }],
        dispatch: (appended, m) =>
          (m.value + appended).replace(/\D/g, "").length > 11
            ? m.compiledMasks[1]
            : m.compiledMasks[0],
      });
    }
    if (whatsappRef.current) {
      IMask(whatsappRef.current, {
        mask: [{ mask: "(00) 00000-0000" }, { mask: "(00) 0000-0000" }],
        dispatch: (appended, m) =>
          (m.value + appended).replace(/\D/g, "").length > 10
            ? m.compiledMasks[0]
            : m.compiledMasks[1],
      });
    }
  }, []);

  useEffect(() => {
    setForm(
      fornecedorSelecionado
        ? { ...fornecedorSelecionado }
        : { nome: "", cpfCnpj: "", endereco: "", whatsapp: "", email: "" }
    );
  }, [fornecedorSelecionado]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function validarCPF(cpfStr) {
    const cpf = (cpfStr || "").replace(/\D/g, "");
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
  }

  function validarCNPJ(cnpjStr) {
    const cnpj = (cnpjStr || "").replace(/\D/g, "");
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = 12;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros[tamanho - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos[0])) return false;

    tamanho++;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros[tamanho - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos[1]);
  }

  const validarForm = () => {
    const errs = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.whatsapp.trim()) errs.whatsapp = "WhatsApp é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    if (!form.cpfCnpj.trim()) {
      errs.cpfCnpj = "CPF/CNPJ é obrigatório";
    } else {
      const num = form.cpfCnpj.replace(/\D/g, "");
      if (num.length === 11 && !validarCPF(form.cpfCnpj))
        errs.cpfCnpj = "CPF inválido";
      else if (num.length === 14 && !validarCNPJ(form.cpfCnpj))
        errs.cpfCnpj = "CNPJ inválido";
      else if (num.length !== 11 && num.length !== 14)
        errs.cpfCnpj = "CPF/CNPJ inválido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarForm()) return;
    const payload = {
      ...form,
      cpfCnpj: (form.cpfCnpj || "").replace(/\D/g, ""),
      whatsapp: (form.whatsapp || "").replace(/\D/g, ""),
    };
    onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto bg-white p-6 rounded shadow-md space-y-6"
    >
      {/* campos idênticos aos seus, mantidos */}
      {/* ... */}
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
