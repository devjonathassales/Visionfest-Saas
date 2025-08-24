import React, { useEffect, useState, useCallback } from "react";
import { FiPlus, FiCheck, FiTrash2, FiEye } from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import ContaReceberForm from "../../components/Form/ContaReceberForm";
import ReceberForm from "../../components/Form/ReceberForm";
import { toast } from "react-toastify";
import api from "../../utils/api";

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

  // NOVO: conta para editar
  const [editandoConta, setEditandoConta] = useState(null);

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
      const { data } = await api.get("/contas-receber");
      setContas(data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContas();
  }, [loadContas]);

  const abrirReceber = (conta) => {
    setContaSel(conta);
    setMostrarReceberForm(true);
  };

  const fecharReceber = () => {
    setContaSel(null);
    setMostrarReceberForm(false);
  };

  const abrirDetalhes = async (conta) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/contas-receber/${conta.id}`);
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
      await api.delete(`/contas-receber/${id}`);
      toast.success("Excluído com sucesso");
      loadContas();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  };

  const estornar = async (id) => {
    if (!confirm("Estornar esta conta?")) return;
    try {
      setLoading(true);
      await api.patch(`/contas-receber/${id}/estornar`);
      toast.success("Estornado com sucesso");
      loadContas();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao estornar");
    } finally {
      setLoading(false);
    }
  };

  const filtered = contas
    .filter((c) => {
      const venc = new Date(c.vencimento);
      return venc >= dataInicial && venc <= dataFinal;
    })
    .filter((c) =>
      pesquisa
        ? c.descricao.toLowerCase().includes(pesquisa.toLowerCase())
        : true
    )
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

  return (
    <div className="p-4 pt-24 space-y-6 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-[#7ED957] text-center mb-6">
        Contas a Receber
      </h1>

      {/* Filtros, busca e botão numa linha */}
      <div className="flex flex-wrap items-center gap-3 border border-gray-300 rounded-md p-4 bg-white shadow-sm">
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="input input-bordered flex-grow min-w-[200px]"
          disabled={loading}
        />
        <select
          className="select select-bordered w-[140px]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          disabled={loading}
        >
          <option value="mensal">Mensal</option>
          <option value="semanal">Semanal</option>
          <option value="diario">Diário</option>
        </select>
        <input
          type="date"
          className="input input-bordered w-[140px]"
          value={format(dataInicial, "yyyy-MM-dd")}
          onChange={(e) => setDataInicial(new Date(e.target.value))}
          disabled={loading}
        />
        <input
          type="date"
          className="input input-bordered w-[140px]"
          value={format(dataFinal, "yyyy-MM-dd")}
          onChange={(e) => setDataFinal(new Date(e.target.value))}
          disabled={loading}
        />
        <button
          onClick={() => {
            setEditandoConta(null); // Limpa edição ao criar nova conta
            setMostrarForm(true);
          }}
          className="btn bg-[#7ED957] text-white font-bold h-[42px] min-w-[160px] px-6 ml-auto flex items-center justify-center gap-2"
          disabled={loading}
        >
          <FiPlus size={20} /> Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border rounded-md shadow-sm bg-white">
        <table className="w-full border-collapse text-center min-w-[700px]">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border px-3 py-2">Descrição</th>
              <th className="border px-3 py-2">Valor</th>
              <th className="border px-3 py-2">Vencimento</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Recebido em</th>
              <th className="border px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-gray-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-3 py-2">{c.descricao}</td>
                  <td className="px-3 py-2">
                    R$ {parseFloat(c.valorTotal).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {format(new Date(c.vencimento), "dd/MM/yyyy")}
                  </td>
                  <td className="px-3 py-2 capitalize">{c.status}</td>
                  <td className="px-3 py-2">
                    {c.status === "pago"
                      ? format(new Date(c.dataRecebimento), "dd/MM/yyyy")
                      : "-"}
                  </td>
                  <td className="px-3 py-2 flex justify-center gap-3">
                    {c.status === "aberto" ? (
                      <>
                        <button
                          onClick={() => {
                            setEditandoConta(c);
                            setMostrarForm(true);
                          }}
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => abrirReceber(c)}
                          title="Receber"
                          className="text-green-600 hover:text-green-800 transition"
                        >
                          <FiCheck size={20} />
                        </button>
                        <button
                          onClick={() => excluir(c.id)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => abrirDetalhes(c)}
                          title="Detalhes"
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <FiEye size={20} />
                        </button>
                        <button
                          onClick={() => estornar(c.id)}
                          title="Estornar"
                          className="text-yellow-600 hover:text-yellow-800 transition"
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

      {/* Formulário criar/editar */}
      {mostrarForm && (
        <ContaReceberForm
          conta={editandoConta}
          onClose={() => {
            setMostrarForm(false);
            setEditandoConta(null);
          }}
          onSave={() => {
            loadContas();
            setMostrarForm(false);
            setEditandoConta(null);
          }}
          loading={loading}
        />
      )}

      {/* Formulário receber */}
      {mostrarReceberForm && contaSel && (
        <ReceberForm
          conta={contaSel}
          onClose={fecharReceber}
          onBaixa={handleReceber}
        />
      )}

      {/* Modal detalhes */}
      {detalhesAberto && contaSel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setDetalhesAberto(false)}
        >
          <div
            className="bg-white p-6 rounded-md w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#7ED957] mb-4">
              Detalhes da Conta Recebida
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Descrição:</span>
                <span>{contaSel.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Vencimento:</span>
                <span>
                  {format(new Date(contaSel.vencimento), "dd/MM/yyyy")}
                </span>
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
                <span className="capitalize">
                  {contaSel.formaPagamento || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor Recebido:</span>
                <span>
                  R$ {parseFloat(contaSel.valorRecebido || 0).toFixed(2)}
                </span>
              </div>

              {/* Dados bancários */}
              {["pix", "debito", "transferencia"].includes(
                contaSel.formaPagamento
              ) &&
                contaSel.contaBancaria && (
                  <>
                    <div className="border-t border-gray-200 pt-2 mt-4 font-medium text-[#7ED957]">
                      Dados da Conta Bancária
                    </div>
                    <div className="flex justify-between mt-1">
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

              {/* Máquina (somente débito) */}
              {contaSel.formaPagamento === "debito" && contaSel.maquina && (
                <div className="flex justify-between mt-3">
                  <span className="font-semibold">Máquina:</span>
                  <span>{contaSel.maquina}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-5 py-2 rounded-lg text-black bg-gray-200 hover:bg-gray-300 transition"
                onClick={() => setDetalhesAberto(false)}
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
