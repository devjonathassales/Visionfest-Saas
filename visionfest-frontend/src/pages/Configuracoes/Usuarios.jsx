import React, { useState } from "react";

export default function CadastroUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    tipo: "comum", // comum ou admin
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.senha !== form.confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    const novoUsuario = {
      id: Date.now(),
      nome: form.nome,
      email: form.email,
      tipo: form.tipo,
    };

    setUsuarios([...usuarios, novoUsuario]);

    setForm({
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      tipo: "comum",
    });

    alert("Usuário cadastrado com sucesso!");
  };

  return (
    <div className="p-8 font-open">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat mb-6">
        Cadastro de Usuários
      </h1>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-md p-6 max-w-xl space-y-4"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Nome</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">E-mail</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Senha
            </label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Tipo de Usuário
          </label>
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
          >
            <option value="comum">Comum</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-[#7ED957] hover:bg-green-600 text-white font-semibold px-6 py-2 rounded shadow"
          >
            Cadastrar Usuário
          </button>
        </div>
      </form>

      {/* Lista de usuários cadastrados */}
      {usuarios.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 font-montserrat">
            Usuários Cadastrados
          </h2>
          <div className="bg-white shadow rounded-md divide-y">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="p-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold">{u.nome}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 capitalize">
                  {u.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
