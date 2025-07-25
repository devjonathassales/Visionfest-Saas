import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      // Chama a API diretamente, passando email e senha
      const response = await api.post("/auth/login", { email, password: senha });

      // Pega os tokens e o usuário do backend
      const { accessToken, refreshToken, usuario } = response.data;

      // Chama o login do contexto com os tokens
      login(accessToken, refreshToken, usuario);

      navigate("/dashboard");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao fazer login";
      setError(mensagem);
    }
  }

  return (
    <div className="flex h-screen justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-[#7ED957] text-center">
          Login Admin
        </h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          required
        />
        <label className="block mb-2 font-semibold">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-6"
          required
        />
        <button
          type="submit"
          className="w-full bg-[#7ED957] text-white py-2 rounded hover:bg-green-600 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
