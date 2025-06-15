import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ContaBancariaForm from '../../components/ContaBancariaForm';
import { toast } from 'react-toastify';

export default function ContasBancarias() {
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);

  useEffect(() => {
    // Simulação de carregamento inicial
    setContas([
      {
        id: 1,
        banco: 'Banco do Brasil',
        agencia: '1234',
        conta: '56789-0',
        chavePix: { tipo: 'CPF', valor: '123.456.789-00' }
      },
      {
        id: 2,
        banco: 'Caixa Econômica',
        agencia: '4321',
        conta: '',
        chavePix: null
      }
    ]);
  }, []);

  const contasFiltradas = contas.filter((c) =>
    `${c.banco} ${c.agencia} ${c.conta}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  const abrirFormNovo = () => {
    setContaEditando(null);
    setFormAberto(true);
  };

  const abrirFormEditar = (conta) => {
    setContaEditando(conta);
    setFormAberto(true);
  };

  const fecharForm = () => {
    setFormAberto(false);
  };

  const salvarConta = (conta) => {
    if (conta.id) {
      setContas(contas.map((c) => (c.id === conta.id ? conta : c)));
      toast.success('Conta atualizada com sucesso!');
    } else {
      conta.id = Date.now();
      setContas([...contas, conta]);
      toast.success('Conta adicionada com sucesso!');
    }
    fecharForm();
  };

  const excluirConta = (id) => {
    // Aqui você faz verificação de títulos vinculados
    const temTituloVinculado = false; // Exemplo fixo
    if (temTituloVinculado) {
      toast.error('Conta não pode ser excluída pois possui títulos vinculados.');
      return;
    }
    setContas(contas.filter((c) => c.id !== id));
    toast.success('Conta excluída com sucesso!');
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
        />
        <button
          onClick={abrirFormNovo}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiPlus /> Adicionar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Banco</th>
              <th className="p-2">Agência</th>
              <th className="p-2">Conta</th>
              <th className="p-2">Pix</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
            {contasFiltradas.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.banco}</td>
                <td className="p-2">{c.agencia}</td>
                <td className="p-2">{c.conta || '-'}</td>
                <td className="p-2">
                  {c.chavePix ? `${c.chavePix.tipo}: ${c.chavePix.valor}` : '-'}
                </td>
                <td className="p-2 text-right flex justify-end gap-2">
                  <button
                    className="text-blue-600"
                    onClick={() => abrirFormEditar(c)}
                    title="Editar"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => excluirConta(c.id)}
                    title="Excluir"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={fecharForm}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold text-xl"
              title="Fechar"
            >
              &times;
            </button>
            <ContaBancariaForm
              conta={contaEditando}
              onCancel={fecharForm}
              onSave={salvarConta}
            />
          </div>
        </div>
      )}
    </div>
  );
}
