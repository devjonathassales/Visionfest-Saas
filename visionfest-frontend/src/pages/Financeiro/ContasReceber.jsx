import React, { useEffect, useState, useCallback } from "react";
import { FiPlus, FiCheck, FiTrash2, FiEye } from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import ContaReceberForm from "../../components/ContaReceberForm";
import ReceberForm from "../../components/ReceberForm";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api/contas-receber";

export default function ContasReceber() {
  const [contas, setContas] = useState([]);
  const [filtro, setFiltro] = useState("mensal");
  const [dataInicial, setDataInicial] = useState(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState(endOfMonth(new Date()));
  const [pesquisa, setPesquisa] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarReceberForm, setMostrarReceberForm] = useState(false);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [contaSel, setContaSel] = useState(null);
  const [loading, setLoading] = useState(false);

  const atualizarPeriodo = (tipo) => {
    const hoje = new Date();
    if (tipo === "mensal") {
      setDataInicial(startOfMonth(hoje));
      setDataFinal(endOfMonth(hoje));
    } else if (tipo === "semanal") {
      setDataInicial(startOfWeek(hoje, { weekStartsOn: 0 }));
      setDataFinal(endOfWeek(hoje, { weekStartsOn: 0 }));
    } else {
      setDataInicial(hoje);
      setDataFinal(hoje);
    }
  };

  useEffect(() => {
    atualizarPeriodo(filtro);
  }, [filtro]);

  const loadContas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();
      setContas(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContas();
  }, [loadContas]);

  const abrirReceber = (c) => {
    setContaSel(c);
    setMostrarReceberForm(true);
  };

  const fecharReceber = () => {
    setContaSel(null);
    setMostrarReceberForm(false);
  };

  const abrirDetalhes = async (conta) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${conta.id}`);
      if (!res.ok) throw new Error("Erro ao carregar detalhes");
      const data = await res.json();
      setContaSel(data);
    } catch {
      toast.error("Erro ao buscar detalhes");
      setContaSel(conta);
    } finally {
      setDetalhesAberto(true);
      setLoading(false);
    }
  };

  const handleReceber = () => {
    toast.success("Recebido com sucesso!");
    fecharReceber();
    loadContas();
  };

  const excluir = async (id) => {
    if (!confirm("Excluir esta conta?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Excluído com sucesso");
      loadContas();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const estornar = async (id) => {
    if (!confirm("Estornar esta conta?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}/estorno`, { method: "PUT" });
      if (!res.ok) throw new Error("Erro ao estornar");
      toast.success("Estornado");
      loadContas();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = contas
    .filter((c) => {
      const v = new Date(c.vencimento);
      return v >= dataInicial && v <= dataFinal;
    })
    .filter((c) =>
      pesquisa ? c.descricao.toLowerCase().includes(pesquisa.toLowerCase()) : true
    )
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-4xl font-bold text-[#7ED957] text-center">
        Contas a Receber
      </h1>

      <div className="flex flex-wrap items-end gap-2 border border-gray-300 rounded-md p-3 bg-white">
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="input input-bordered w-full sm:w-[45%] min-w-[160px]"
          disabled={loading}
        />
        <select
          className="select select-bordered w-full sm:w-[10%] min-w-[130px]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="mensal">Mensal</option>
          <option value="semanal">Semanal</option>
          <option value="diario">Diário</option>
        </select>
        <input
          type="date"
          className="input input-bordered w-full sm:w-[13%] w-[130px]"
          value={format(dataInicial, "yyyy-MM-dd")}
          onChange={(e) => setDataInicial(new Date(e.target.value))}
        />
        <input
          type="date"
          className="input input-bordered w-full sm:w-[13%] w-[130px]"
          value={format(dataFinal, "yyyy-MM-dd")}
          onChange={(e) => setDataFinal(new Date(e.target.value))}
        />
        <button
          onClick={() => setMostrarForm(true)}
          className="btn bg-[#7ED957] text-white font-bold h-[42px] min-w-[160px] px-6 w-full sm:w-auto sm:ml-auto flex items-center justify-center"
          disabled={loading}
        >
          <FiPlus className="mr-1" /> Nova Conta
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-center">
          <thead className="bg-gray-100">
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Recebido em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td>{c.descricao}</td>
                  <td>R$ {parseFloat(c.valorTotal).toFixed(2)}</td>
                  <td>{format(new Date(c.vencimento), "dd/MM/yyyy")}</td>
                  <td className="capitalize">{c.status}</td>
                  <td>
                    {c.status === "pago"
                      ? format(new Date(c.dataRecebimento), "dd/MM/yyyy")
                      : "-"}
                  </td>
                  <td className="flex gap-2 justify-center">
                    {c.status === "aberto" ? (
                      <>
                        <button
                          className="text-green-600"
                          title="Receber"
                          onClick={() => abrirReceber(c)}
                        >
                          <FiCheck />
                        </button>
                        <button
                          className="text-red-600"
                          title="Excluir"
                          onClick={() => excluir(c.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-blue-600"
                          title="Detalhes"
                          onClick={() => abrirDetalhes(c)}
                        >
                          <FiEye />
                        </button>
                        <button
                          className="text-yellow-600"
                          title="Estornar"
                          onClick={() => estornar(c.id)}
                        >
                          ↩
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <ContaReceberForm onClose={() => setMostrarForm(false)} onSave={loadContas} />
      )}

      {mostrarReceberForm && contaSel && (
        <ReceberForm conta={contaSel} onClose={fecharReceber} onBaixa={handleReceber} />
      )}

      {detalhesAberto && contaSel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-[#7ED957]">
              Detalhes da Conta Recebida
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Descrição:</span>
                <span>{contaSel.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Cliente:</span>
                <span>{contaSel.cliente?.nome || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Vencimento:</span>
                <span>{format(new Date(contaSel.vencimento), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Recebido em:</span>
                <span>
                  {contaSel.dataRecebimento
                    ? format(new Date(contaSel.dataRecebimento), "dd/MM/yyyy")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Forma de Pagamento:</span>
                <span className="capitalize">{contaSel.formaPagamento || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor Recebido:</span>
                <span>R$ {parseFloat(contaSel.valorRecebido || 0).toFixed(2)}</span>
              </div>

              {/* Dados Bancários */}
              {["pix", "debito", "transferencia"].includes(contaSel.formaPagamento) &&
                contaSel.contaBancaria && (
                  <>
                    <div className="border-t border-gray-200 pt-2 mt-2 font-medium text-[#7ED957]">
                      Dados da Conta Bancária
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Banco:</span>
                      <span>{contaSel.contaBancaria.banco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Agência:</span>
                      <span>{contaSel.contaBancaria.agencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Conta:</span>
                      <span>{contaSel.contaBancaria.conta}</span>
                    </div>
                  </>
                )}

              {/* Crédito/Débito info */}
              {["debito", "credito"].includes(contaSel.formaPagamento) && contaSel.maquina && (
                <div className="flex justify-between">
                  <span className="font-semibold">Máquina:</span>
                  <span>{contaSel.maquina}</span>
                </div>
              )}
              {contaSel.formaPagamento === "credito" && contaSel.cartaoCredito && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2 font-medium text-[#7ED957]">
                    Informações do Crédito
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Cartão:</span>
                    <span>{contaSel.cartaoCredito.banco}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Taxa repassada:</span>
                    <span>{contaSel.taxaRepassada ? "Sim" : "Não"}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setDetalhesAberto(false)}
                className="px-5 py-2 rounded-lg text-black bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
