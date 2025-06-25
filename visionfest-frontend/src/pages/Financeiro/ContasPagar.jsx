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

  const carregarContas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Erro ao buscar contas");
      const data = await res.json();
      setContas(data);
    } catch (err) {
      toast.error("Erro ao carregar contas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      // Buscar conta detalhada do backend para garantir contaBancaria completa
      const res = await fetch(`${API_URL}/${conta.id}`);
      if (!res.ok) throw new Error("Erro ao carregar detalhes da conta");
      const contaDetalhada = await res.json();

      setContaSelecionada(contaDetalhada);
      setDetalhesAberto(true);
    } catch (err) {
      toast.error("Erro ao carregar detalhes: " + err.message);
      // fallback: abrir com dados que já temos
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
      // Atualiza o contaSelecionada para mostrar dados atualizados
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

  const contasFiltradas = contas.filter((c) =>
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      {/* Filtro e botão */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
          disabled={loading}
        />
        <button
          onClick={abrirForm}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          disabled={loading}
        >
          <FiPlus /> Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Centro de Custo</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-center">Vencimento</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-4">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              contasFiltradas.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{c.descricao}</td>
                  <td className="p-2">{c.centroCusto?.descricao || "-"}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-[#7ED957]">
              Detalhes da Conta Paga
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Descrição:</span>
                <span>{contaSelecionada.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Centro de Custo:</span>
                <span>{contaSelecionada.centroCusto?.descricao || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Vencimento:</span>
                <span>
                  {new Date(contaSelecionada.vencimento).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Data de Baixa:</span>
                <span>
                  {contaSelecionada.dataPagamento
                    ? new Date(
                        contaSelecionada.dataPagamento
                      ).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Forma de Pagamento:</span>
                <span>{contaSelecionada.formaPagamento || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor Pago:</span>
                <span>
                  R$ {parseFloat(contaSelecionada.valorPago || 0).toFixed(2)}
                </span>
              </div>

              {/* Detalhes Bancários se aplicável */}
              {(contaSelecionada.formaPagamento === "pix" ||
                contaSelecionada.formaPagamento === "debito" ||
                contaSelecionada.formaPagamento === "credito") &&
                contaSelecionada.contaBancaria && (
                  <>
                    <div className="border-t border-gray-200 pt-2 mt-2 font-medium text-[#7ED957]">
                      Dados da Conta Bancária
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Banco:</span>
                      <span>{contaSelecionada.contaBancaria.banco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Agência:</span>
                      <span>{contaSelecionada.contaBancaria.agencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Conta:</span>
                      <span>{contaSelecionada.contaBancaria.conta}</span>
                    </div>
                  </>
                )}

              {contaSelecionada.formaPagamento === "credito" &&
                contaSelecionada.tipoCredito && (
                  <>
                    <div className="border-t border-gray-200 pt-2 mt-2 font-medium text-[#7ED957]">
                      Informações do Crédito
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Tipo de Crédito:</span>
                      <span>
                        {contaSelecionada.tipoCredito === "parcelado"
                          ? "Parcelado"
                          : "À vista"}
                      </span>
                    </div>
                    {contaSelecionada.tipoCredito === "parcelado" && (
                      <div className="flex justify-between">
                        <span className="font-semibold">Parcelas:</span>
                        <span>{contaSelecionada.parcelas}</span>
                      </div>
                    )}
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
