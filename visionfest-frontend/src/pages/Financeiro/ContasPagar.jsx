import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiCheck, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ContasPagarForm from '../../components/ContaPagarForm';
import PagamentoContaForm from '../../components/PagamentoContaForm';

const API_URL = 'http://localhost:5000/api/contas-pagar';

export default function ContasPagar() {
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregarContas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Erro ao buscar contas');
      const data = await res.json();
      setContas(data);
    } catch (err) {
      toast.error('Erro ao carregar contas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  const contasFiltradas = contas.filter((c) =>
    c.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirForm = () => {
    setContaSelecionada(null);
    setFormAberto(true);
  };

  const abrirPagamento = (conta) => {
    setContaSelecionada(conta);
    setPagamentoAberto(true);
    setFormAberto(false);
  };

  const excluirConta = async (id) => {
    if (!window.confirm('Deseja excluir esta conta?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir conta');
      toast.success('Conta excluída com sucesso!');
      await carregarContas(); // recarrega a lista
    } catch (err) {
      toast.error('Erro ao excluir conta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const pagarConta = async (dados) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/baixar/${contaSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error('Erro ao pagar conta');
      toast.success('Pagamento realizado com sucesso!');
      setPagamentoAberto(false);
      await carregarContas();
    } catch (err) {
      toast.error('Erro ao pagar conta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
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
                  <td className="p-2">{c.centroCusto?.descricao || '-'}</td>
                  <td className="p-2 text-right">R$ {parseFloat(c.valorTotal).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    {new Date(c.vencimento).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-center capitalize">{c.status}</td>
                  <td className="p-2 text-right flex justify-end gap-2">
                    {c.status === 'aberto' && (
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
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Formulário de nova conta */}
      {formAberto && (
        <ContasPagarForm
          conta={contaSelecionada}
          onClose={() => setFormAberto(false)}
          setContas={setContas}
          onPagar={abrirPagamento}
        />
      )}

      {/* Formulário de pagamento */}
      {pagamentoAberto && contaSelecionada && (
        <PagamentoContaForm
          conta={contaSelecionada}
          onClose={() => setPagamentoAberto(false)}
          onConfirm={pagarConta}
          disabled={loading}
        />
      )}
    </div>
  );
}
