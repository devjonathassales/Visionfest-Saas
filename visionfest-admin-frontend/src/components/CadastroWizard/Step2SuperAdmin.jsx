import React from "react";

export default function Step2SuperAdmin({ superAdmin, setSuperAdmin }) {
  function handleChange(e) {
    const { name, value } = e.target;
    setSuperAdmin((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Usuário SuperAdmin</h2>
      <input
        name="usuario"
        placeholder="E-mail do SuperAdmin *"
        type="email"
        value={superAdmin.usuario}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="senha"
        placeholder="Senha *"
        type="password"
        value={superAdmin.senha}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="confirmarSenha"
        placeholder="Confirmar Senha *"
        type="password"
        value={superAdmin.confirmarSenha}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
    </div>
  );
}
