import React, { useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import { useNavigate } from "react-router-dom";
import logo from "/src/assets/visionfest-logo.svg"; // coloque seu arquivo aqui (veja nota abaixo)

export default function LoginPage() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const res = await login(form);
    if (res.ok) {
      nav("/", { replace: true });
    } else {
      setErro(res.error || "Não foi possível entrar.");
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 md:bg-gradient-to-br md:from-[#0A1F16] md:via-[#084C61] md:to-[#0A1F16]">
      {/* Vitrine (desktop) */}
      <aside className="hidden md:flex w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#7ED957_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative z-10 text-center text-white max-w-md">
          <img src={logo} alt="VisionFest" className="h-14 mx-auto mb-6" />
          <h1 className="text-3xl font-bold">Bem-vindo ao VisionFest</h1>
          <p className="mt-2 text-slate-200">
            Acesse o painel e gerencie seus contratos, financeiro e estoque em
            um só lugar.
          </p>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex w-full md:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="md:hidden text-center mb-6">
            <img src={logo} alt="VisionFest" className="h-10 mx-auto" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Entrar</h2>
          <p className="text-slate-500 text-sm mb-6">
            Use seu e-mail e sua senha de acesso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="exemplo@empresa.com"
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-4 focus:ring-[#7ED957]/30 focus:border-[#7ED957]"
              />
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="senha"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, senha: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-slate-800 placeholder-slate-400
                             focus:outline-none focus:ring-4 focus:ring-[#7ED957]/30 focus:border-[#7ED957]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="text-red-700 text-sm bg-red-50 rounded-md p-2 border border-red-200">
                {erro}
              </div>
            )}

            {/* Ações */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-[#7ED957] text-slate-900 font-semibold py-2.5
                         hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-4 focus:ring-[#7ED957]/40"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} VisionFest • Todos os direitos
            reservados
          </div>
        </div>
      </main>
    </div>
  );
}
