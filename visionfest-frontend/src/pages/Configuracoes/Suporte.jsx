import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";

const WHATSAPP_SUPORTE =
  import.meta.env.VITE_SUPORTE_WHATSAPP || "5599999999999";

export default function SuportePage() {
  const { apiCliente } = useAuth();

  const [assunto, setAssunto] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [mensagem, setMensagem] = useState("");
  const [anexos, setAnexos] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const [chamados, setChamados] = useState([]);
  const [loadingChamados, setLoadingChamados] = useState(true);

  const carregarChamados = async () => {
    setLoadingChamados(true);
    try {
      const { data } = await apiCliente.get("/suporte/chamados");
      setChamados(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChamados(false);
    }
  };

  useEffect(() => {
    carregarChamados();
  }, []);

  const abrirChamado = async (e) => {
    e.preventDefault();
    if (!assunto || !mensagem) {
      alert("Preencha assunto e descrição.");
      return;
    }
    const form = new FormData();
    form.append("assunto", assunto);
    form.append("prioridade", prioridade);
    form.append("mensagem", mensagem);
    for (const file of anexos) form.append("anexos", file);

    try {
      setEnviando(true);
      await apiCliente.post("/suporte/chamados", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Chamado enviado com sucesso!");
      setAssunto("");
      setPrioridade("media");
      setMensagem("");
      setAnexos([]);
      await carregarChamados();
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao enviar chamado.");
    } finally {
      setEnviando(false);
    }
  };

  const abrirWhatsapp = () => {
    const texto = encodeURIComponent("Olá, preciso de suporte no VisionFest.");
    window.open(`https://wa.me/${WHATSAPP_SUPORTE}?text=${texto}`, "_blank");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-open">
      <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat">
        Suporte
      </h1>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-5 shadow hover:shadow-lg transition">
          <h2 className="font-montserrat font-semibold text-lg mb-2">
            Abrir chamado
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Envie uma solicitação para nossa equipe. Você pode anexar prints ou
            arquivos.
          </p>
          <button
            className="bg-[#7ED957] hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={() =>
              document
                .getElementById("form-suporte")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ir para formulário
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow hover:shadow-lg transition">
          <h2 className="font-montserrat font-semibold text-lg mb-2">
            Chat (em breve)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Conversa direta com nosso time dentro do sistema (feature em
            desenvolvimento).
          </p>
          <button
            disabled
            className="px-4 py-2 rounded border border-gray-300 text-gray-500 cursor-not-allowed"
            title="Em breve"
          >
            Abrir chat
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow hover:shadow-lg transition">
          <h2 className="font-montserrat font-semibold text-lg mb-2">
            WhatsApp
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Precisa de algo rápido? Fale conosco pelo WhatsApp do suporte.
          </p>
          <button
            className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
            onClick={abrirWhatsapp}
          >
            Ir para WhatsApp
          </button>
        </div>
      </div>

      {/* Form abrir chamado */}
      <div id="form-suporte" className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 font-montserrat text-[#C0C0C0]">
          Formulário de Suporte
        </h2>
        <form onSubmit={abrirChamado} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Assunto</label>
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
              placeholder="Ex: Erro ao salvar contrato"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Descrição</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
              placeholder="Descreva o problema, passos para reproduzir, etc."
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Anexos (prints/arquivos, opcional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => setAnexos(Array.from(e.target.files || []))}
              className="block"
            />
            <p className="text-xs text-gray-500 mt-1">
              Até 5 arquivos, 10 MB cada.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="bg-[#7ED957] hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar chamado"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de chamados do cliente */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 font-montserrat text-[#C0C0C0]">
          Meus Chamados
        </h2>
        {loadingChamados ? (
          <p>Carregando...</p>
        ) : chamados.length === 0 ? (
          <p className="text-gray-500">Você ainda não abriu chamados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">#</th>
                  <th className="py-2">Assunto</th>
                  <th className="py-2">Prioridade</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{c.id}</td>
                    <td className="py-2">{c.assunto}</td>
                    <td className="py-2 capitalize">{c.prioridade}</td>
                    <td className="py-2">
                      <span
                        className={
                          "px-2 py-1 rounded text-xs " +
                          (c.status === "aberto"
                            ? "bg-yellow-100 text-yellow-800"
                            : c.status === "em_andamento"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800")
                        }
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2">
                      {new Date(c.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
