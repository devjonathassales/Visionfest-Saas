import React, { useState, useEffect } from "react";
import IMask from "imask";

const API_BASE = "http://localhost:5000/api";

export default function EmpresaForm({
  empresa: inicial,
  onCancelar,
  onSalvar,
}) {
  const [empresa, setEmpresa] = useState(inicial);

  // Sempre que inicial mudar (editar outra empresa), atualiza estado local
  useEffect(() => {
    setEmpresa(inicial);
  }, [inicial]);

  // Aplica máscara usando imask
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

  // Validação CPF/CNPJ básica (não aceita todos iguais)
  const validarCpfCnpj = (value) => {
    const v = value.replace(/\D/g, "");
    if (v.length === 11) {
      return !/^(\d)\1{10}$/.test(v);
    }
    if (v.length === 14) {
      return !/^(\d)\1{13}$/.test(v);
    }
    return false;
  };

  // Buscar endereço pelo CEP via ViaCEP
  const buscarEndereco = async (cep, index) => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const novosEnderecos = [...empresa.enderecos];
        novosEnderecos[index] = {
          ...novosEnderecos[index],
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        };
        setEmpresa({ ...empresa, enderecos: novosEnderecos });
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    }
  };

  // Atualiza campos de empresa ou endereço
  const handleChange = (e, index = null, campo = null) => {
    if (campo !== null && index !== null) {
      const novosEnderecos = [...empresa.enderecos];
      const valor =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

      if (campo === "cep") {
        novosEnderecos[index][campo] = valor;
        buscarEndereco(valor, index);
      } else {
        novosEnderecos[index][campo] = valor;
      }

      // Se marcar endereço padrão, desmarca os outros
      if (campo === "padrao" && e.target.checked) {
        novosEnderecos.forEach((_, i) => {
          novosEnderecos[i].padrao = i === index;
        });
      }

      setEmpresa({ ...empresa, enderecos: novosEnderecos });
    } else {
      const { name, value } = e.target;
      setEmpresa({ ...empresa, [name]: value });
    }
  };

  // Upload da logo
  const handleLogoUpload = (e) => {
    setEmpresa({ ...empresa, logo: e.target.files[0] });
  };

  // Adiciona novo endereço
  const adicionarEndereco = () => {
    setEmpresa({
      ...empresa,
      enderecos: [
        ...empresa.enderecos,
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

  // Remove endereço (não obrigatório, só se quiser)
  const removerEndereco = (index) => {
    if (empresa.enderecos.length === 1) {
      alert("Deve haver pelo menos um endereço.");
      return;
    }
    const novosEnderecos = empresa.enderecos.filter((_, i) => i !== index);
    setEmpresa({ ...empresa, enderecos: novosEnderecos });
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCpfCnpj(empresa.documento)) {
      alert("CPF ou CNPJ inválido");
      return;
    }

    try {
      const formData = new FormData();

      // Campos simples
      formData.append("nome", empresa.nome);
      formData.append("documento", empresa.documento);
      formData.append("whatsapp", empresa.whatsapp);
      formData.append("telefone", empresa.telefone);
      formData.append("email", empresa.email);
      formData.append("instagram", empresa.instagram);
      formData.append("enderecos", JSON.stringify(empresa.enderecos));

      // Logo pode ser File ou string (nome)
      if (empresa.logo && typeof empresa.logo !== "string") {
        formData.append("logo", empresa.logo);
      }

      const url = empresa.id
        ? `${API_BASE}/empresa/${empresa.id}`
        : `${API_BASE}/empresa`;
      const method = empresa.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao salvar empresa");
      }

      alert("Empresa salva com sucesso!");
      onSalvar();
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-md p-6 space-y-6 max-w-3xl mx-auto font-open"
    >
      <h2 className="text-2xl font-semibold text-[#7ED957] mb-4">
        {empresa.id ? "Editar Empresa" : "Nova Empresa"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Nome da Empresa</label>
          <input
            type="text"
            name="nome"
            value={empresa.nome}
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
            value={applyMask(empresa.documento, "cpfcnpj")}
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
            value={applyMask(empresa.whatsapp, "cel")}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label>Telefone</label>
          <input
            type="text"
            name="telefone"
            value={applyMask(empresa.telefone, "tel")}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label>E-mail</label>
          <input
            type="email"
            name="email"
            value={empresa.email}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label>Instagram</label>
          <input
            type="text"
            name="instagram"
            value={empresa.instagram}
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
        {/* Se logo for string (nome), mostrar imagem */}
        {empresa.logo && typeof empresa.logo === "string" && (
          <img
            src={`${API_BASE.replace("/api", "")}/uploads/${empresa.logo}`}
            alt="Logo"
            className="mt-2 h-24 object-contain"
          />
        )}
        {/* Se logo for arquivo local, mostrar nome */}
        {empresa.logo && typeof empresa.logo !== "string" && (
          <p>Arquivo: {empresa.logo.name}</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Endereço(s)</h3>
        {empresa.enderecos.map((end, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded mt-2">
            <div className="grid md:grid-cols-3 gap-4">
              <input
                placeholder="CEP"
                value={applyMask(end.cep, "cep")}
                onChange={(e) => handleChange(e, i, "cep")}
                className="input"
              />
              <input
                placeholder="Logradouro"
                value={end.logradouro}
                onChange={(e) => handleChange(e, i, "logradouro")}
                className="input"
              />
              <input
                placeholder="Número"
                value={end.numero}
                onChange={(e) => handleChange(e, i, "numero")}
                className="input"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
              <input
                placeholder="Bairro"
                value={end.bairro}
                onChange={(e) => handleChange(e, i, "bairro")}
                className="input"
              />
              <input
                placeholder="Cidade"
                value={end.cidade}
                onChange={(e) => handleChange(e, i, "cidade")}
                className="input"
              />
              <input
                placeholder="Estado"
                value={end.estado}
                onChange={(e) => handleChange(e, i, "estado")}
                className="input"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={end.padrao}
                onChange={(e) => handleChange(e, i, "padrao")}
              />
              <label>Endereço Padrão</label>
              <button
                type="button"
                className="ml-auto text-red-500 font-bold"
                onClick={() => removerEndereco(i)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 bg-gray-200 px-3 py-1 rounded"
          onClick={adicionarEndereco}
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
