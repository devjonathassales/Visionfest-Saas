import React, { useState, useEffect, useRef } from 'react';
import IMask from 'imask';

export default function ClienteForm({ onSave, clienteSelecionado, onCancel }) {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    celular: '',
    dataNascimento: '',
    email: '',
    instagram: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [errors, setErrors] = useState({});

  const cpfRef = useRef(null);
  const whatsappRef = useRef(null);
  const celularRef = useRef(null);
  const cepRef = useRef(null);
  const dataNascimentoRef = useRef(null);

  useEffect(() => {
    if (cpfRef.current) {
      IMask(cpfRef.current, { mask: '000.000.000-00' });
    }
    if (whatsappRef.current) {
      IMask(whatsappRef.current, {
        mask: [
          { mask: '(00) 00000-0000', startsWith: '9', lazy: false },
          { mask: '(00) 0000-0000', lazy: false }
        ],
        dispatch: function (appended, dynamicMasked) {
          var number = (dynamicMasked.value + appended).replace(/\D/g, '');
          return number.length > 10 ? dynamicMasked.compiledMasks[0] : dynamicMasked.compiledMasks[1];
        }
      });
    }
    if (celularRef.current) {
      IMask(celularRef.current, {
        mask: [
          { mask: '(00) 00000-0000', startsWith: '9', lazy: false },
          { mask: '(00) 0000-0000', lazy: false }
        ],
        dispatch: function (appended, dynamicMasked) {
          var number = (dynamicMasked.value + appended).replace(/\D/g, '');
          return number.length > 10 ? dynamicMasked.compiledMasks[0] : dynamicMasked.compiledMasks[1];
        }
      });
    }
    if (cepRef.current) {
      IMask(cepRef.current, { mask: '00000-000' });
    }
    if (dataNascimentoRef.current) {
      IMask(dataNascimentoRef.current, {
        mask: Date,
        pattern: 'd{/}`m{/}`Y',
        lazy: false,
        blocks: {
          d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
          m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
          Y: { mask: IMask.MaskedRange, from: 1900, to: 2099 }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (clienteSelecionado) {
      setForm({ ...clienteSelecionado });
    }
  }, [clienteSelecionado]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function validarCPF(strCPF) {
    const cpf = strCPF.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  }

  async function buscarEndereco(cep) {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'cep' && value.replace(/\D/g, '').length === 8) {
      buscarEndereco(value);
    }
  };

  const validarForm = () => {
    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!form.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp é obrigatório';
    if (!form.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(form.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    if (!form.email.trim()) newErrors.email = 'Email é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarForm()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md space-y-6">
      <div>
        <label className="block font-semibold mb-1" htmlFor="nome">Nome *</label>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="whatsapp">WhatsApp *</label>
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
          <label className="block font-semibold mb-1" htmlFor="celular">Celular</label>
          <input
            id="celular"
            name="celular"
            type="text"
            ref={celularRef}
            value={form.celular}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="email">Email *</label>
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
        <div>
          <label className="block font-semibold mb-1" htmlFor="instagram">Instagram</label>
          <input
            id="instagram"
            name="instagram"
            type="text"
            value={form.instagram}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="cpf">CPF *</label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            ref={cpfRef}
            value={form.cpf}
            onChange={handleChange}
            className={`input w-full ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.cpf && <p className="text-red-600 text-sm mt-1">{errors.cpf}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="dataNascimento">Data de Nascimento</label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            type="text"
            ref={dataNascimentoRef}
            value={form.dataNascimento}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="cep">CEP</label>
          <input
            id="cep"
            name="cep"
            type="text"
            ref={cepRef}
            value={form.cep}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="logradouro">Logradouro</label>
          <input
            id="logradouro"
            name="logradouro"
            type="text"
            value={form.logradouro}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="numero">Número</label>
          <input
            id="numero"
            name="numero"
            type="text"
            value={form.numero}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="complemento">Complemento</label>
          <input
            id="complemento"
            name="complemento"
            type="text"
            value={form.complemento}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="bairro">Bairro</label>
          <input
            id="bairro"
            name="bairro"
            type="text"
            value={form.bairro}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="cidade">Cidade</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            value={form.cidade}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="estado">Estado</label>
          <input
            id="estado"
            name="estado"
            type="text"
            value={form.estado}
            onChange={handleChange}
            className="input w-full border border-gray-300"
          />
        </div>
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
