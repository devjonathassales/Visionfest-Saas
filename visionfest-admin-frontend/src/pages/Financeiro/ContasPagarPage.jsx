import React, { useEffect, useState, useCallback } from "react";
import { FiPlus, FiCheck, FiTrash2, FiEye } from "react-icons/fi";
import api from "../../utils/api";
import ContasPagarForm from "../../components/Form/ContaPagarForm";
import PagamentoContaForm from "../../components/Form/PagamentoContaForm";
import { toast } from "react-toastify";

function ModalDetalhes({ conta, onClose }) {
  if (!conta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-green-600">Detalhes da Conta</h2>

        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>Descrição:</strong> {conta.descricao}
          </div>
          <div>
            <strong>Centro de Custo:</strong> {conta.centroCusto?.descricao || "-"}
          </div>
          <div>
            <strong>Fornecedor:</strong> {conta.fornecedor || "-"}
          </div>
          <div>
            <strong>Vencimento:</strong>{" "}
            {new Date(conta.vencimento).toLocaleDateString()}
          </div>
          <div>
            <strong>Valor Total:</strong> R$ {parseFloat(conta.valorTotal).toFixed(2)}
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span className={`capitalize ${conta.status === "pago" ? "text-green-600" : "text-red-600"}`}>
              {conta.status}
            </span>
          </div>

          {conta.status === "pago" && (
            <>
              <hr />
              <h3 className="font-semibold text-green-600 mb-2">Dados do Pagamento</h3>
              <div>
                <strong>Data do Pagamento:</strong>{" "}
                {conta.dataPagamento
                  ? new Date(conta.dataPagamento).toLocaleDateString()
                  : "-"}
              </div>
              <div>
                <strong>Forma de Pagamento:</strong> {conta.formaPagamento || "-"}
              </div>
              <div>
                <strong>Valor Pago:</strong> R$ {parseFloat(conta.valorPago).toFixed(2)}
              </div>
              <div>
                <strong>Troco:</strong> R$ {parseFloat(conta.troco || 0).toFixed(2)}
              </div>
              {conta.tipoCredito && (
                <div>
                  <strong>Tipo de Crédito:</strong> {conta.tipoCredito}
                </div>
              )}
              {conta.parcelas && (
                <div>
                  <strong>Parcelas:</strong> {conta.parcelas}
                </div>
              )}
              {conta.contaBancaria && (
                <div>
                  <strong>Conta Bancária:</strong>{" "}
                  {`${conta.contaBancaria.banco} - Agência: ${conta.contaBancaria.agencia} - Conta: ${conta.contaBancaria.conta}`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContasPagarPage() {
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("mensal");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const getDatasPorPeriodo = (tipo) => {
    const hoje = new Date();
    let inicio, fim;
    if (tipo === "mensal") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (tipo === "semanal") {
      const diff = hoje.getDate() - hoje.getDay();
      inicio = new Date(hoje.setDate(diff));
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
    } else {
      inicio = fim = hoje;
    }
    return {
      inicio: inicio.toISOString().substring(0, 10),
      fim: fim.toISOString().substring(0, 10),
    };
  };

  useEffect(() => {
    const { inicio, fim } = getDatasPorPeriodo(periodo);
    setDataInicio(inicio);
    setDataFim(fim);
  }, [periodo]);

  const carregarContas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contas-pagar", {
        params: { dataInicio, dataFim },
      });
      setContas(res.data);
    } catch (err) {
      toast.error("Erro ao carregar contas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  const abrirForm = () => {
    setContaSelecionada(null);
    setFormAberto(true);
    setPagamentoAberto(false);
    setDetalhesAberto(false);
  };

  const abrirPagamento = (conta) => {
    setPagamentoAberto(true);
    setContaSelecionada(conta);
  };

  const abrirDetalhes = async (conta) => {
    setLoading(true);
    try {
      const res = await api.get(`/contas-pagar/${conta.id}`);
      setContaSelecionada(res.data);
    } catch {
      setContaSelecionada(conta);
    } finally {
      setLoading(false);
      setDetalhesAberto(true);
    }
  };

  const excluirConta = async (id) => {
    if (!window.confirm("Confirma exclusão?")) return;
    setLoading(true);
    try {
      await api.delete(`/contas-pagar/${id}`);
      toast.success("Conta excluída!");
      carregarContas();
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const pagarConta = async (dados) => {
    setLoading(true);
    try {
      await api.put(`/contas-pagar/${contaSelecionada.id}/baixa`, dados);
      toast.success("Pagamento realizado!");
      setPagamentoAberto(false);
      carregarContas();
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const estornarConta = async (id) => {
    if (!window.confirm("Confirma estorno?")) return;
    setLoading(true);
    try {
      await api.put(`/contas-pagar/${id}/estorno`);
      toast.success("Conta estornada!");
      carregarContas();
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const contasFiltradas = contas.filter((c) =>
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 pt-20 space-y-4">
      <h1 className="text-center text-3xl font-bold text-green-600">Contas a Pagar</h1>

      <div className="flex flex-wrap items-end gap-2 bg-white p-4 rounded shadow-sm">
        <input
          type="text"
          placeholder="Buscar descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          disabled={loading}
          className="border rounded px-3 py-2 flex-1 min-w-[160px]"
        />
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          disabled={loading}
          className="border rounded px-3 py-2 min-w-[130px]"
        >
          <option value="mensal">Mensal</option>
          <option value="semanal">Semanal</option>
          <option value="diario">Diário</option>
        </select>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          disabled={loading}
          className="border rounded px-3 py-2 min-w-[130px]"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          disabled={loading}
          className="border rounded px-3 py-2 min-w-[130px]"
        />
        <button
          onClick={abrirForm}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <FiPlus className="inline" /> Nova Conta
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Centro</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-center">Venc.</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              contasFiltradas.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{c.descricao}</td>
                  <td className="p-2">{c.centroCusto?.descricao || "-"}</td>
                  <td className="p-2 text-right">R$ {parseFloat(c.valorTotal).toFixed(2)}</td>
                  <td className="p-2 text-center">{new Date(c.vencimento).toLocaleDateString()}</td>
                  <td className="p-2 text-center capitalize">{c.status}</td>
                  <td className="p-2 flex justify-end gap-2">
                    {c.status === "aberto" ? (
                      <>
                        <button onClick={() => abrirPagamento(c)} className="text-green-600">
                          <FiCheck />
                        </button>
                        <button onClick={() => excluirConta(c.id)} className="text-red-600">
                          <FiTrash2 />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => abrirDetalhes(c)} className="text-blue-600">
                          <FiEye />
                        </button>
                        <button onClick={() => estornarConta(c.id)} className="text-yellow-600">
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

      {formAberto && (
        <ContasPagarForm
          conta={contaSelecionada}
          onClose={() => setFormAberto(false)}
          onSave={() => {
            carregarContas();
          }}
          onPagar={(conta) => {
            carregarContas();
            abrirPagamento(conta);
          }}
        />
      )}

      {pagamentoAberto && contaSelecionada && (
        <PagamentoContaForm
          conta={contaSelecionada}
          onClose={() => setPagamentoAberto(false)}
          onConfirm={pagarConta}
          disabled={loading}
        />
      )}

      {detalhesAberto && contaSelecionada && (
        <ModalDetalhes conta={contaSelecionada} onClose={() => setDetalhesAberto(false)} />
      )}
    </div>
  );
}
