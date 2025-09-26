import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import apiClienteFallback from "/src/utils/apiCliente.js"; // fallback

export default function Faturas() {
  const auth = useAuth(); // pode ser null se faltar Provider
  const apiCliente = auth?.apiCliente || apiClienteFallback;

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const carregar = async () => {
    if (!apiCliente?.get) {
      setErro(
        "API do cliente não configurada. Verifique o AuthProvider/baseURL."
      );
      setLoading(false);
      return;
    }
    setIsSyncing(true);
    setErro(null);
    try {
      // OBS: se seu backend monta /api/faturas, mantenha apenas "/faturas"
      // porque o baseURL já deve incluir "/api"
      const { data } = await apiCliente.get("/faturas");
      setItens(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro(
        e?.response?.data?.mensagem || e?.message || "Erro ao carregar faturas"
      );
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moeda = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const fmtData = (iso) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

  const linhas = useMemo(() => {
    const arr = [...itens];
    arr.sort((a, b) => {
      const av = a?.vencimento ? new Date(a.vencimento).getTime() : 0;
      const bv = b?.vencimento ? new Date(b.vencimento).getTime() : 0;
      return av - bv;
    });
    return arr;
  }, [itens]);

  const statusBadge = (f) => {
    const isOpen = String(f.status || "").toLowerCase() === "aberto";
    const venc = f.vencimento ? new Date(f.vencimento) : null;
    const hoje = new Date();
    if (venc) {
      venc.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);
    }
    const atrasado = isOpen && venc && venc < hoje;
    const status = atrasado
      ? "atrasado"
      : String(f.status || "aberto").toLowerCase();
    const cls =
      status === "pago"
        ? "bg-green-600 text-white"
        : status === "atrasado"
        ? "bg-red-600 text-white"
        : status === "cancelado"
        ? "bg-gray-500 text-white"
        : "bg-yellow-400 text-black";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
        {status}
      </span>
    );
  };

  if (loading) return <p>Carregando faturas…</p>;
  if (erro) return <p className="text-red-600">{erro}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Faturas do SaaS</h1>
        <div className="flex items-center gap-3">
          {isSyncing && (
            <span className="text-sm text-gray-500">Sincronizando…</span>
          )}
          <button
            onClick={carregar}
            className="px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Atualizar
          </button>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p>Nenhuma fatura encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Descrição</th>
                <th className="py-2 pr-2">Competência</th>
                <th className="py-2 pr-2">Vencimento</th>
                <th className="py-2 pr-2 text-right">Valor</th>
                <th className="py-2 pr-2 text-center">Status</th>
                <th className="py-2 pr-2 text-center">Ref. Admin</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-2">{f.numero ?? f.id ?? "-"}</td>
                  <td className="py-2 pr-2">{f.descricao}</td>
                  <td className="py-2 pr-2">{f.competencia || "-"}</td>
                  <td className="py-2 pr-2">{fmtData(f.vencimento)}</td>
                  <td className="py-2 pr-2 text-right">{moeda(f.valor)}</td>
                  <td className="py-2 pr-2 text-center">{statusBadge(f)}</td>
                  <td className="py-2 pr-2 text-center">
                    <span
                      title="ID da ContaReceber no admin (public)"
                      className="text-xs text-gray-500"
                    >
                      {f.referenciaPublicContaId ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-gray-500">
            * Faturas são geradas/baixadas pelo financeiro do VisionFest
            (admin). Esta tela atualiza automaticamente a cada 15s — use o botão
            “Atualizar” para forçar uma sincronização.
          </p>
        </div>
      )}
    </div>
  );
}
