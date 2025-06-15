import React, { useState, useEffect, useRef } from "react";
import IMask from "imask";

export default function ClienteForm({ onSave, clienteSelecionado, onCancel }) {
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    whatsapp: "",
    celular: "",
    dataNascimento: "",
    email: "",
    instagram: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [errors, setErrors] = useState({});

  // Referências para inputs
  const cpfRef = useRef(null);
  const whatsappRef = useRef(null);
  const celularRef = useRef(null);
  const cepRef = useRef(null);
  const dataNascimentoRef = useRef(null);

  // Guardar instâncias IMask para manipular se precisar
  const maskRefs = useRef({});

  // Inicializar máscaras e salvar instâncias para escutar 'accept' e atualizar estado
  useEffect(() => {
    if (cpfRef.current) {
      maskRefs.current.cpf = IMask(cpfRef.current, {
        mask: "000.000.000-00",
        lazy: false,
      });
      maskRefs.current.cpf.on("accept", () => {
        setForm((prev) => ({
          ...prev,
          cpf: maskRefs.current.cpf.value,
        }));
      });
    }

    if (whatsappRef.current) {
      maskRefs.current.whatsapp = IMask(whatsappRef.current, {
        mask: [
          { mask: "(00) 00000-0000", startsWith: "9", lazy: false },
          { mask: "(00) 0000-0000", lazy: false },
        ],
        dispatch: (appended, dynamicMasked) => {
          const number = (dynamicMasked.value + appended).replace(/\D/g, "");
          return number.length > 10
            ? dynamicMasked.compiledMasks[0]
            : dynamicMasked.compiledMasks[1];
        },
      });
      maskRefs.current.whatsapp.on("accept", () => {
        setForm((prev) => ({
          ...prev,
          whatsapp: maskRefs.current.whatsapp.value,
        }));
      });
    }

    if (celularRef.current) {
      maskRefs.current.celular = IMask(celularRef.current, {
        mask: [
          { mask: "(00) 00000-0000", startsWith: "9", lazy: false },
          { mask: "(00) 0000-0000", lazy: false },
        ],
        dispatch: (appended, dynamicMasked) => {
          const number = (dynamicMasked.value + appended).replace(/\D/g, "");
          return number.length > 10
            ? dynamicMasked.compiledMasks[0]
            : dynamicMasked.compiledMasks[1];
        },
      });
      maskRefs.current.celular.on("accept", () => {
        setForm((prev) => ({
          ...prev,
          celular: maskRefs.current.celular.value,
        }));
      });
    }

    if (cepRef.current) {
      maskRefs.current.cep = IMask(cepRef.current, {
        mask: "00000-000",
        lazy: false,
      });
      maskRefs.current.cep.on("accept", () => {
        setForm((prev) => ({
          ...prev,
          cep: maskRefs.current.cep.value,
        }));
      });
    }

    if (dataNascimentoRef.current) {
  maskRefs.current.dataNascimento = IMask(dataNascimentoRef.current, {
    mask: IMask.MaskedDate,
    pattern: "d{/}m{/}Y",
    lazy: false,
    blocks: {
      d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
      m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
      Y: { mask: IMask.MaskedRange, from: 1900, to: 2099 },
    },
  });
  maskRefs.current.dataNascimento.on("accept", () => {
    setForm((prev) => ({
      ...prev,
      dataNascimento: maskRefs.current.dataNascimento.value,
    }));
  });
}
    // Limpar máscaras ao desmontar
    return () => {
      Object.values(maskRefs.current).forEach((mask) => mask.destroy());
      maskRefs.current = {};
    };
  }, []);

  // Quando clienteSelecionado mudar, atualizar estado e máscaras
  useEffect(() => {
  if (clienteSelecionado) {
    setForm({ ...clienteSelecionado });
    setTimeout(() => {
      if (maskRefs.current.cpf) {
        maskRefs.current.cpf.value = clienteSelecionado.cpf || "";
        maskRefs.current.cpf.updateValue();
      }
      if (maskRefs.current.whatsapp) {
        maskRefs.current.whatsapp.value = clienteSelecionado.whatsapp || "";
        maskRefs.current.whatsapp.updateValue();
      }
      if (maskRefs.current.celular) {
        maskRefs.current.celular.value = clienteSelecionado.celular || "";
        maskRefs.current.celular.updateValue();
      }
      if (maskRefs.current.cep) {
        maskRefs.current.cep.value = clienteSelecionado.cep || "";
        maskRefs.current.cep.updateValue();
      }
      if (maskRefs.current.dataNascimento) {
        maskRefs.current.dataNascimento.value = clienteSelecionado.dataNascimento || "";
        maskRefs.current.dataNascimento.updateValue();
      }
    }, 0);
  }
}, [clienteSelecionado]);
  // Fechar form com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Validação CPF (sem alterações)
  function validarCPF(strCPF) {
    const cpf = strCPF.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  }

  // Buscar endereço pelo CEP
  async function buscarEndereco(cep) {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        const cidadesIBGE = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${data.uf}/municipios`
        ).then((res) => res.json());

        const cidadeOficial =
          cidadesIBGE.find(
            (c) => c.nome.toLowerCase() === data.localidade.toLowerCase()
          )?.nome || data.localidade;

        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: cidadeOficial,
          estado: data.uf || "",
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar endereço pelo CEP:", err);
    }
  }

  // Atualizar campos de texto simples (exceto campos com máscara, que são controlados por 'accept')
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Só atualizar estado para campos não mascarados
    if (
      ["cpf", "whatsapp", "celular", "cep", "dataNascimento"].includes(name)
    ) {
      // máscara atualiza via evento 'accept', ignorar onChange normal
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    // Quando CEP completar, buscar endereço
    if (name === "cep" && value.replace(/\D/g, "").length === 8) {
      buscarEndereco(value);
    }
  };

  // Validar formulário
  const validarForm = () => {
    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";

    // Validar WhatsApp: deve estar preenchido e ter o formato completo (14 ou 15 caracteres)
    const whatsappLen = form.whatsapp.replace(/\D/g, "").length;
    if (!form.whatsapp.trim()) newErrors.whatsapp = "WhatsApp é obrigatório";
    else if (whatsappLen < 10)
      // mínimo para telefone fixo + DDD (10 dígitos)
      newErrors.whatsapp = "WhatsApp incompleto";

    if (!form.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validarCPF(form.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!form.email.trim()) newErrors.email = "Email é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar para backend (sem alterações)
  const salvarClienteBackend = async (dados) => {
    try {
      const urlBase = "http://localhost:3333/api/clientes";
      const isEdit = !!dados.id;

      const response = await fetch(
        isEdit ? `${urlBase}/${dados.id}` : urlBase,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(
          "Erro ao salvar cliente: " +
            (errorData.message || response.statusText)
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
      console.error(error);
      return null;
    }
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarForm()) return;

    const dadosParaSalvar = {
      ...form,
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      whatsapp: form.whatsapp.trim(),
      celular: form.celular.trim(),
      dataNascimento: form.dataNascimento.trim(),
      email: form.email.trim(),
      instagram: form.instagram.trim(),
      cep: form.cep.trim(),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim(),
      id: clienteSelecionado?.id || undefined,
    };

    const clienteSalvo = await salvarClienteBackend(dadosParaSalvar);
    if (clienteSalvo) onSave(clienteSalvo);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md space-y-6"
    >
      <div>
        <label className="block font-semibold mb-1" htmlFor="nome">
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="whatsapp">
            WhatsApp *
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="text"
            ref={whatsappRef}
            value={form.whatsapp}
            onChange={handleChange}
            className={`input w-full ${
              errors.whatsapp ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.whatsapp && (
            <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="celular">
            Celular
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="email">
            Email *
          </label>
          <input
            id="email"
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
          <label className="block font-semibold mb-1" htmlFor="instagram">
            Instagram
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="cpf">
            CPF *
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            ref={cpfRef}
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
          <label className="block font-semibold mb-1" htmlFor="dataNascimento">
            Data de Nascimento
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="cep">
            CEP
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="logradouro">
            Logradouro
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="numero">
            Número
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="complemento">
            Complemento
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="bairro">
            Bairro
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="cidade">
            Cidade
          </label>
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
          <label className="block font-semibold mb-1" htmlFor="estado">
            Estado
          </label>
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
