import React, { useState } from "react";

export default function CadastroEmpresa() {
  const [empresa, setEmpresa] = useState({
    nome: "",
    documento: "",
    whatsapp: "",
    telefone: "",
    email: "",
    instagram: "",
    logo: null,
    enderecos: [
      { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", padrao: true }
    ],
  });

  const handleChange = (e, index = null, campo = null) => {
    if (campo && index !== null) {
      const novosEnderecos = [...empresa.enderecos];
      novosEnderecos[index][campo] = e.target.type === "checkbox" ? e.target.checked : e.target.value;

      // Se marcar como padrão, desmarca os outros
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

  const handleLogoUpload = (e) => {
    setEmpresa({ ...empresa, logo: e.target.files[0] });
  };

  const adicionarEndereco = () => {
    setEmpresa({
      ...empresa,
      enderecos: [
        ...empresa.enderecos,
        { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "", padrao: false },
      ],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você pode enviar os dados para a API
    alert("Empresa cadastrada com sucesso!");
  };

  return (
    <div className="p-8 font-open">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6">
        Cadastro de Empresa
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-md p-6 space-y-6 max-w-3xl">
        {/* Dados básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Nome da Empresa</label>
            <input
              type="text"
              name="nome"
              value={empresa.nome}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">CPF ou CNPJ</label>
            <input
              type="text"
              name="documento"
              value={empresa.documento}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Whatsapp</label>
            <input
              type="text"
              name="whatsapp"
              value={empresa.whatsapp}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={empresa.telefone}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">E-mail</label>
            <input
              type="email"
              name="email"
              value={empresa.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Instagram</label>
            <input
              type="text"
              name="instagram"
              value={empresa.instagram}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#7ED957]"
            />
          </div>
        </div>

        {/* Upload de Logo */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Logomarca</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full"
          />
          {empresa.logo && (
            <p className="text-sm text-gray-600 mt-1">
              Arquivo selecionado: {empresa.logo.name}
            </p>
          )}
        </div>

        {/* Endereços */}
        <div>
          <h2 className="text-xl font-montserrat font-semibold text-gray-800 mb-2">
            Endereço(s)
          </h2>
          {empresa.enderecos.map((endereco, index) => (
            <div key={index} className="mb-4 border p-4 rounded bg-gray-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Logradouro"
                  value={endereco.logradouro}
                  onChange={(e) => handleChange(e, index, "logradouro")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Número"
                  value={endereco.numero}
                  onChange={(e) => handleChange(e, index, "numero")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Bairro"
                  value={endereco.bairro}
                  onChange={(e) => handleChange(e, index, "bairro")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Cidade"
                  value={endereco.cidade}
                  onChange={(e) => handleChange(e, index, "cidade")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Estado"
                  value={endereco.estado}
                  onChange={(e) => handleChange(e, index, "estado")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="CEP"
                  value={endereco.cep}
                  onChange={(e) => handleChange(e, index, "cep")}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={endereco.padrao}
                  onChange={(e) => handleChange(e, index, "padrao")}
                />
                <label className="text-gray-700">Tornar este endereço o padrão</label>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" onChange={adicionarEndereco} />
            <label className="text-gray-700">Adicionar outro endereço</label>
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-[#7ED957] hover:bg-green-600 text-white font-semibold px-6 py-2 rounded shadow"
          >
            Salvar Empresa
          </button>
        </div>
      </form>
    </div>
  );
}
