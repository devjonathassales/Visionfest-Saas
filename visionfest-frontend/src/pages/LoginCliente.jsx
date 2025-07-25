import { useState } from "react";
import api from "../utils/apiCliente";

export default function LoginCliente() {
  const [dominio, setDominio] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const { data } = await api.post("/login", { dominio, email, senha });
      localStorage.setItem("token", data.token);
      // Redirecionar para o dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Erro ao fazer login.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-green-600">
          VisionFest Login
        </h2>
        {erro && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{erro}</div>
        )}
        <input
          type="text"
          placeholder="Domínio"
          value={dominio}
          onChange={(e) => setDominio(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
