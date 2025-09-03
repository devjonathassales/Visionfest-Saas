// src/components/EmpresaForm.jsx
import React, { useState, useEffect } from "react";
import IMask from "imask";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function EmpresaForm({
  empresa: inicial,
  onCancelar,
  onSalvar,
}) {
  const { apiCliente } = useAuth();
  const [empresa, setEmpresa] = useState(
    inicial || {
      nome: "",
      documento: "",
      whatsapp: "",
      telefone: "",
      email: "",
      instagram: "",
      logo: null,
      enderecos: [],
    }
  );

  useEffect(() => {
    setEmpresa(
      inicial || {
        nome: "",
        documento: "",
        whatsapp: "",
        telefone: "",
        email: "",
        instagram: "",
        logo: null,
        enderecos: [],
      }
    );
  }, [inicial]);

  const applyMask = (value, type) => {
    if (!value) return "";
    if (type === "cpfcnpj") {
      const mask =
        value.replace(/\D/g, "").length > 11
          ? "00.000.000/0000-00"
          : "000.000.000-00";
      return IMask.createMask({ mask }).resolve(value);
    }
    if (type === "tel")
      return IMask.createMask({ mask: "(00) 0000-0000" }).resolve(value);
    if (type === "cel")
      return IMask.createMask({ mask: "(00) 00000-0000" }).resolve(value);
    if (type === "cep")
      return IMask.createMask({ mask: "00000-000" }).resolve(value);
    return value;
  };

  const validarCpfCnpj = (value) => {
    const v = (value || "").replace(/\D/g, "");
    if (v.length === 11) return !/^(\d)\1{10}$/.test(v);
    if (v.length === 14) return !/^(\d)\1{13}$/.test(v);
    return false;
  };

  const handleChange = (e, index = null, campo = null) => {
    if (campo !== null && index !== null) {
      const novos = [...(empresa.enderecos || [])];
      const valor =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

      novos[index][campo] = valor;

      if (campo === "padrao" && valor) {
        novos.forEach((_, i) => {
          novos[i].padrao = i === index;
        });
      }
      setEmpresa({ ...empresa, enderecos: novos });
    } else {
      const { name, value } = e.target;
      setEmpresa({ ...empresa, [name]: value });
    }
  };

  const handleLogoUpload = (e) => {
    setEmpresa({ ...empresa, logo: e.target.files[0] });
  };

  const adicionarEnderecoLocal = () => {
    setEmpresa({
      ...empresa,
      enderecos: [
        ...(empresa.enderecos || []),
        {
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
          padrao: false,
        },
      ],
    });
  };

  const removerEnderecoLocal = (index) => {
    const list = [...(empresa.enderecos || [])];
    if (list.length <= 1) return alert("Deve haver pelo menos um endereço.");
    list.splice(index, 1);
    setEmpresa({ ...empresa, enderecos: list });
  };

  // Envia empresa (campos + logo)
  const submitEmpresa = async (e) => {
    e.preventDefault();

    if (!validarCpfCnpj(empresa.documento)) {
      alert("CPF/CNPJ inválido");
      return;
    }

    const formData = new FormData();
    formData.append("nome", empresa.nome || "");
    formData.append("documento", empresa.documento || "");
    formData.append("whatsapp", empresa.whatsapp || "");
    formData.append("telefone", empresa.telefone || "");
    formData.append("email", empresa.email || "");
    formData.append("instagram", empresa.instagram || "");
    if (empresa.logo && typeof empresa.logo !== "string") {
      formData.append("logo", empresa.logo);
    }

    try {
      await apiCliente.put("/empresa", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Sincroniza endereços (opcional: envie cada um conforme situação)
      // Aqui vamos simplificar: garantir que exista pelo menos um endereço;
      // Para CRUD detalhado, use botões separados chamando /empresa/enderecos...
      for (const end of empresa.enderecos || []) {
        if (!end.id) {
          await apiCliente.post("/empresa/enderecos", end);
        } else {
          await apiCliente.put(`/empresa/enderecos/${end.id}`, end);
        }
      }

      alert("Empresa salva com sucesso!");
      onSalvar();
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao salvar empresa");
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={submitEmpresa}
      className="bg-white shadow-md rounded-md p-6 space-y-6 max-w-3xl mx-auto font-open"
    >
      <h2 className="text-2xl font-semibold text-[#7ED957] mb-4">
        {empresa?.id ? "Editar Empresa" : "Nova Empresa"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Nome da Empresa</label>
          <input
            type="text"
            name="nome"
            value={empresa.nome || ""}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
        <div>
          <label>CPF ou CNPJ</label>
          <input
            type="text"
            name="documento"
            value={applyMask(empresa.documento || "", "cpfcnpj")}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
        <div>
          <label>Whatsapp</label>
          <input
            type="text"
            name="whatsapp"
            value={applyMask(empresa.whatsapp || "", "cel")}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label>Telefone</label>
          <input
            type="text"
            name="telefone"
            value={applyMask(empresa.telefone || "", "tel")}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label>E-mail</label>
          <input
            type="email"
            name="email"
            value={empresa.email || ""}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label>Instagram</label>
          <input
            type="text"
            name="instagram"
            value={empresa.instagram || ""}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div>
        <label>Logomarca</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="input"
        />
        {empresa.logo && typeof empresa.logo === "string" && (
          <img
            src={`/uploads/${empresa.logo}`}
            alt="Logo"
            className="mt-2 h-24 object-contain"
          />
        )}
        {empresa.logo && typeof empresa.logo !== "string" && (
          <p>Arquivo: {empresa.logo.name}</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Endereço(s)</h3>
        {(empresa.enderecos || []).map((end, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded mt-2">
            <div className="grid md:grid-cols-3 gap-4">
              <input
                placeholder="CEP"
                value={applyMask(end.cep || "", "cep")}
                onChange={(e) => handleChange(e, i, "cep")}
                className="input"
              />
              <input
                placeholder="Logradouro"
                value={end.logradouro || ""}
                onChange={(e) => handleChange(e, i, "logradouro")}
                className="input"
              />
              <input
                placeholder="Número"
                value={end.numero || ""}
                onChange={(e) => handleChange(e, i, "numero")}
                className="input"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
              <input
                placeholder="Bairro"
                value={end.bairro || ""}
                onChange={(e) => handleChange(e, i, "bairro")}
                className="input"
              />
              <input
                placeholder="Cidade"
                value={end.cidade || ""}
                onChange={(e) => handleChange(e, i, "cidade")}
                className="input"
              />
              <input
                placeholder="Estado"
                value={end.estado || ""}
                onChange={(e) => handleChange(e, i, "estado")}
                className="input"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!end.padrao}
                onChange={(e) => handleChange(e, i, "padrao")}
              />
              <label>Endereço Padrão</label>
              <button
                type="button"
                className="ml-auto text-red-500 font-bold"
                onClick={() => removerEnderecoLocal(i)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 bg-gray-200 px-3 py-1 rounded"
          onClick={adicionarEnderecoLocal}
        >
          + Adicionar Endereço
        </button>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancelar}
          className="px-6 py-2 rounded border border-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-[#7ED957] hover:bg-green-600 text-white px-6 py-2 rounded"
        >
          Salvar Empresa
        </button>
      </div>
    </form>
  );
}
