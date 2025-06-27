import React, { useEffect, useState, useCallback } from "react";
import { FiPlus, FiCheck, FiTrash2, FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import ContasPagarForm from "../../components/ContaPagarForm";
import PagamentoContaForm from "../../components/PagamentoContaForm";

const API_URL = "http://localhost:5000/api/contas-pagar";

export default function ContasPagar() {
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

  // Novo estado para filtro por fornecedor
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorIdFiltro, setFornecedorIdFiltro] = useState("");

  // Função para obter datas conforme período
  const getDatasPorPeriodo = (tipo) => {
    const hoje = new Date();
    let inicio, fim;

    if (tipo === "mensal") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (tipo === "semanal") {
      const dia = hoje.getDay();
      const diff = hoje.getDate() - dia;
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

  // Atualiza dataInicio e dataFim quando muda o período
  useEffect(() => {
    const { inicio, fim } = getDatasPorPeriodo(periodo);
    setDataInicio(inicio);
    setDataFim(fim);
  }, [periodo]);

  // Buscar fornecedores para filtro (supondo API /api/fornecedores)
  const carregarFornecedores = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/fornecedores");
      if (!res.ok) throw new Error("Erro ao buscar fornecedores");
      const dados = await res.json();
      setFornecedores(dados);
    } catch (err) {
      toast.error("Erro ao carregar fornecedores: " + err.message);
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
  }, [carregarFornecedores]);

  // Carregar contas com filtro (incluindo fornecedorIdFiltro)
  const carregarContas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        fornecedorId: fornecedorIdFiltro,
      });
      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar contas");
      const data = await res.json();
      setContas(data);
    } catch (err) {
      toast.error("Erro ao carregar contas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, fornecedorIdFiltro]);

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  // Os outros métodos permanecem os mesmos...
  const abrirForm = () => {
    setContaSelecionada(null);
    setFormAberto(true);
    setPagamentoAberto(false);
    setDetalhesAberto(false);
  };

  const abrirPagamento = (conta) => {
    setFormAberto(false);
    setContaSelecionada(conta);
    setPagamentoAberto(true);
    setDetalhesAberto(false);
  };

  const abrirDetalhes = async (conta) => {
    setFormAberto(false);
    setPagamentoAberto(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${conta.id}`);
      if (!res.ok) throw new Error("Erro ao carregar detalhes da conta");
      const contaDetalhada = await res.json();
      setContaSelecionada(contaDetalhada);
      setDetalhesAberto(true);
    } catch (err) {
      toast.error("Erro ao carregar detalhes: " + err.message);
      setContaSelecionada(conta);
      setDetalhesAberto(true);
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = async (id) => {
    if (!window.confirm("Deseja excluir esta conta?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir conta");
      toast.success("Conta excluída com sucesso!");
      await carregarContas();
    } catch (err) {
      toast.error("Erro ao excluir conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const pagarConta = async (dados) => {
    if (!contaSelecionada?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${contaSelecionada.id}/baixa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error("Erro ao pagar conta");
      const contaAtualizada = await res.json();
      toast.success("Pagamento realizado com sucesso!");
      setPagamentoAberto(false);
      setContaSelecionada(contaAtualizada);
      await carregarContas();
    } catch (err) {
      toast.error("Erro ao pagar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const estornarConta = async (id) => {
    if (!window.confirm("Deseja estornar esta conta?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}/estorno`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Erro ao estornar conta");
      toast.success("Conta estornada com sucesso!");
      await carregarContas();
    } catch (err) {
      toast.error("Erro ao estornar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtra localmente pelo texto da busca na descrição
  const contasFiltradas = contas.filter((c) =>
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-4xl font-bold text-[#7ED957] text-center">Contas a Pagar</h1>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-2 border border-gray-300 rounded-md p-3 bg-white">
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input input-bordered w-full sm:w-[25%] min-w-[160px]"
          disabled={loading}
        />

        <select
          className="select select-bordered w-full sm:w-[10%] min-w-[130px]"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          disabled={loading}
        >
          <option value="mensal">Mensal</option>
          <option value="semanal">Semanal</option>
          <option value="diario">Diário</option>
        </select>

        <input
          type="date"
          className="input input-bordered w-full sm:w-[13%] min-w-[130px]"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          disabled={loading}
        />

        <input
          type="date"
          className="input input-bordered w-full sm:w-[13%] min-w-[130px]"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          disabled={loading}
        />

        {/* Novo filtro por fornecedor */}
        <select
          className="select select-bordered w-full sm:w-[20%] min-w-[180px]"
          value={fornecedorIdFiltro}
          onChange={(e) => setFornecedorIdFiltro(e.target.value)}
          disabled={loading}
        >
          <option value="">Todos os fornecedores</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>

        <button
          onClick={abrirForm}
          className="btn bg-[#7ED957] text-white font-bold h-[42px] min-w-[160px] px-6 w-full sm:w-auto sm:ml-auto"
          disabled={loading}
        >
          <FiPlus className="mr-1" /> Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Centro de Custo</th>
              <th className="p-2 text-left">Fornecedor</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-center">Vencimento</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              contasFiltradas.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{c.descricao}</td>
                  <td className="p-2">{c.centroCusto?.descricao || "-"}</td>
                  <td className="p-2">{c.fornecedor?.nome || "-"}</td>
                  <td className="p-2 text-right">
                    R$ {parseFloat(c.valorTotal).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {new Date(c.vencimento).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-center capitalize">{c.status}</td>
                  <td className="p-2 text-right flex justify-end gap-2">
                    {c.status === "aberto" ? (
                      <>
                        <button
                          className="text-green-600"
                          title="Pagar"
                          onClick={() => abrirPagamento(c)}
                          disabled={loading}
                        >
                          <FiCheck />
                        </button>
                        <button
                          className="text-red-600"
                          title="Excluir"
                          onClick={() => excluirConta(c.id)}
                          disabled={loading}
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
                          disabled={loading}
                        >
                          <FiEye />
                        </button>
                        <button
                          className="text-yellow-600"
                          title="Estornar"
                          onClick={() => estornarConta(c.id)}
                          disabled={loading}
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

      {/* Modal: Nova Conta */}
      {formAberto && (
        <ContasPagarForm
          onClose={() => setFormAberto(false)}
          onSave={carregarContas}
          onPagar={(conta) => {
            carregarContas();
            abrirPagamento(conta);
          }}
        />
      )}

      {/* Modal: Pagamento */}
      {pagamentoAberto && contaSelecionada && (
        <PagamentoContaForm
          conta={contaSelecionada}
          onClose={() => setPagamentoAberto(false)}
          onConfirm={pagarConta}
          disabled={loading}
        />
      )}

      {/* Modal: Detalhes da Conta Paga */}
      {detalhesAberto && contaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-lg relative">
            <button
              onClick={() => setDetalhesAberto(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black font-bold text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Detalhes da Conta</h2>
            <p><strong>Descrição:</strong> {contaSelecionada.descricao}</p>
            <p><strong>Centro de Custo:</strong> {contaSelecionada.centroCusto?.descricao || "-"}</p>
            <p><strong>Fornecedor:</strong> {contaSelecionada.fornecedor?.nome || "-"}</p>
            <p><strong>Valor Total:</strong> R$ {parseFloat(contaSelecionada.valorTotal).toFixed(2)}</p>
            <p><strong>Vencimento:</strong> {new Date(contaSelecionada.vencimento).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {contaSelecionada.status}</p>
            {contaSelecionada.status === "pago" && (
              <>
                <p><strong>Data Pagamento:</strong> {new Date(contaSelecionada.dataPagamento).toLocaleDateString()}</p>
                <p><strong>Forma Pagamento:</strong> {contaSelecionada.formaPagamento}</p>
                {contaSelecionada.contaBancaria && (
                  <p>
                    <strong>Conta Bancária:</strong> {contaSelecionada.contaBancaria.banco} - Agência {contaSelecionada.contaBancaria.agencia} - Conta {contaSelecionada.contaBancaria.conta}
                  </p>
                )}
                <p><strong>Valor Pago:</strong> R$ {parseFloat(contaSelecionada.valorPago).toFixed(2)}</p>
                <p><strong>Troco:</strong> R$ {parseFloat(contaSelecionada.troco || 0).toFixed(2)}</p>
                {contaSelecionada.formaPagamento === "credito" && (
                  <>
                    <p><strong>Tipo Crédito:</strong> {contaSelecionada.tipoCredito}</p>
                    {contaSelecionada.tipoCredito === "parcelado" && (
                      <p><strong>Parcelas:</strong> {contaSelecionada.parcelas}</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
