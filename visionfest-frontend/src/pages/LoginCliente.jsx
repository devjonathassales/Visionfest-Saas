// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const res = await login(form);
    if (res.ok) {
      nav("/", { replace: true });
    } else {
      setErro(res.error);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "64px auto", fontFamily: "sans-serif" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={form.senha}
          onChange={(e) => setForm((s) => ({ ...s, senha: e.target.value }))}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {erro && <div style={{ color: "crimson" }}>{erro}</div>}
      </form>
    </div>
  );
}
