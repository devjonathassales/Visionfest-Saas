import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../../utils/auth";

const API_BASE_URL = "http://localhost:5001/api";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.mensagem || "Erro no login");
        return;
      }

      setToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro de conexão com o servidor");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80">
      <h2 className="text-2xl text-[#7ED957] font-bold text-center mb-4">
        Login Admin
      </h2>
      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      <label className="block mb-2">Email</label>
      <input
        type="email"
        className="w-full p-2 border rounded mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label className="block mb-2">Senha</label>
      <input
        type="password"
        className="w-full p-2 border rounded mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full bg-[#7ED957] text-white p-2 rounded hover:bg-green-600 transition"
      >
        Entrar
      </button>
    </form>
  );
}
