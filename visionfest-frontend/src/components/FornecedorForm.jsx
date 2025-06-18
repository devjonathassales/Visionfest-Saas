import React, { useState, useEffect, useRef } from 'react';
import IMask from 'imask';

export default function FornecedorForm({ onSave, fornecedorSelecionado, onCancel }) {
  const [form, setForm] = useState({
    nome: '',
    cpfCnpj: '',
    endereco: '',
    whatsapp: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const cpfCnpjRef = useRef(null);
  const whatsappRef = useRef(null);

  // Máscaras para CPF/CNPJ e WhatsApp
  useEffect(() => {
    if (cpfCnpjRef.current) {
      IMask(cpfCnpjRef.current, {
        mask: [
          { mask: '000.000.000-00' },
          { mask: '00.000.000/0000-00' }
        ],
        dispatch: (appended, dynamicMasked) => {
          const number = (dynamicMasked.value + appended).replace(/\D/g, '');
          return number.length > 11
            ? dynamicMasked.compiledMasks[1]
            : dynamicMasked.compiledMasks[0];
        }
      });
    }

    if (whatsappRef.current) {
      IMask(whatsappRef.current, {
        mask: [
          { mask: '(00) 00000-0000' },
          { mask: '(00) 0000-0000' }
        ],
        dispatch: (appended, dynamicMasked) => {
          const number = (dynamicMasked.value + appended).replace(/\D/g, '');
          return number.length > 10
            ? dynamicMasked.compiledMasks[0]
            : dynamicMasked.compiledMasks[1];
        }
      });
    }
  }, []);

  useEffect(() => {
    if (fornecedorSelecionado) {
      setForm({ ...fornecedorSelecionado });
    } else {
      setForm({
        nome: '',
        cpfCnpj: '',
        endereco: '',
        whatsapp: '',
        email: '',
      });
    }
  }, [fornecedorSelecionado]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function validarCPF(strCPF) {
    const cpf = strCPF.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
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

  function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0, pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros[tamanho - i] * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos[0])) return false;

    tamanho++;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros[tamanho - i] * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos[1]);
  }

  const validarForm = () => {
    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!form.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp é obrigatório';
    if (!form.email.trim()) newErrors.email = 'Email é obrigatório';

    if (!form.cpfCnpj.trim()) {
      newErrors.cpfCnpj = 'CPF/CNPJ é obrigatório';
    } else {
      const num = form.cpfCnpj.replace(/\D/g, '');
      if (num.length === 11 && !validarCPF(form.cpfCnpj)) {
        newErrors.cpfCnpj = 'CPF inválido';
      } else if (num.length === 14 && !validarCNPJ(form.cpfCnpj)) {
        newErrors.cpfCnpj = 'CNPJ inválido';
      } else if (num.length !== 11 && num.length !== 14) {
        newErrors.cpfCnpj = 'CPF/CNPJ inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarForm()) return;

    // Normaliza dados antes de salvar (remove máscara)
    const fornecedorLimpo = {
      ...form,
      cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
      whatsapp: form.whatsapp.replace(/\D/g, '')
    };

    onSave(fornecedorLimpo);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded shadow-md space-y-6">
      <div>
        <label htmlFor="nome" className="block font-semibold mb-1">Nome *</label>
        <input
          id="nome"
          name="nome"
          type="text"
          value={form.nome}
          onChange={handleChange}
          className={`input w-full ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
      </div>

      <div>
        <label htmlFor="cpfCnpj" className="block font-semibold mb-1">CPF/CNPJ *</label>
        <input
          id="cpfCnpj"
          name="cpfCnpj"
          type="text"
          ref={cpfCnpjRef}
          value={form.cpfCnpj}
          onChange={handleChange}
          className={`input w-full ${errors.cpfCnpj ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.cpfCnpj && <p className="text-red-600 text-sm mt-1">{errors.cpfCnpj}</p>}
      </div>

      <div>
        <label htmlFor="endereco" className="block font-semibold mb-1">Endereço</label>
        <input
          id="endereco"
          name="endereco"
          type="text"
          value={form.endereco}
          onChange={handleChange}
          className="input w-full border border-gray-300"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block font-semibold mb-1">WhatsApp *</label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          ref={whatsappRef}
          value={form.whatsapp}
          onChange={handleChange}
          className={`input w-full ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block font-semibold mb-1">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className={`input w-full ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

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
