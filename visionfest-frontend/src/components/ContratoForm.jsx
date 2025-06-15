import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export default function ContratoForm({ onClose, onSave }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [itensContrato, setItensContrato] = useState([]);
  const [tema, setTema] = useState('');
  const [dataEvento, setDataEvento] = useState(dayjs().format('YYYY-MM-DD'));
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [endereco, setEndereco] = useState('');
  const [buffet, setBuffet] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('valor');
  const [entrada, setEntrada] = useState(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState('');
  const [parcelas] = useState([]); // Declarado apenas se for usar no futuro
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [dataContrato, setDataContrato] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    // Simula dados de clientes e produtos
    setClientes([
      { id: 1, nome: 'João da Silva' },
      { id: 2, nome: 'Maria Oliveira' },
    ]);
    setProdutos([
      { id: 1, nome: 'Cadeira Tiffany', valor: 10 },
      { id: 2, nome: 'Mesa de Vidro', valor: 50 },
    ]);
    setFormasPagamento(['PIX', 'Cartão de Crédito', 'Dinheiro']);
  }, []);

  const adicionarProduto = (produtoId) => {
    const produto = produtos.find((p) => p.id === parseInt(produtoId));
    if (!produto) return;

    setItensContrato([...itensContrato, { ...produto, quantidade: 1 }]);
  };

  const atualizarQuantidade = (index, qtd) => {
    const novosItens = [...itensContrato];
    novosItens[index].quantidade = Number(qtd);
    setItensContrato(novosItens);
  };

  const removerItem = (index) => {
    const novosItens = [...itensContrato];
    novosItens.splice(index, 1);
    setItensContrato(novosItens);
  };

  const valorBruto = itensContrato.reduce((total, item) => total + item.valor * item.quantidade, 0);
  const valorComDesconto = tipoDesconto === 'percentual'
    ? valorBruto - (valorBruto * desconto / 100)
    : valorBruto - desconto;

  const valorRestante = valorComDesconto - entrada;

  const handleSalvar = () => {
    const contrato = {
      cliente: clienteSelecionado,
      itens: itensContrato,
      tema,
      dataEvento,
      horaInicio,
      horaFim,
      endereco,
      buffet,
      valorBruto,
      desconto,
      tipoDesconto,
      valorTotal: valorComDesconto,
      entrada,
      formaPagamentoEntrada,
      valorRestante,
      parcelas,
      dataContrato,
    };
    onSave(contrato);
  };

  const clientesFiltrados = buscaCliente.length >= 3
    ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#7ED957] mb-4">Novo Contrato</h2>

        {/* Cliente */}
        <label className="block mb-1 font-semibold">Cliente</label>
        <input
          type="text"
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
          placeholder="Digite o nome do cliente"
          className="border w-full p-2 rounded mb-2"
        />
        {clientesFiltrados.map(c => (
          <div
            key={c.id}
            className="p-2 border rounded cursor-pointer hover:bg-gray-100"
            onClick={() => {
              setClienteSelecionado(c);
              setBuscaCliente(c.nome);
            }}
          >
            {c.nome}
          </div>
        ))}

        {/* Produtos */}
        <div className="mt-4">
          <label className="block font-semibold mb-1">Produtos / Serviços</label>
          <select
            className="border w-full p-2 rounded mb-2"
            onChange={(e) => adicionarProduto(e.target.value)}
          >
            <option>Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} - R$ {p.valor}
              </option>
            ))}
          </select>

          {itensContrato.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between mb-2">
              <span>{item.nome}</span>
              <input
                type="number"
                value={item.quantidade}
                min={1}
                className="border p-1 w-16 mx-2"
                onChange={(e) => atualizarQuantidade(idx, e.target.value)}
              />
              <button onClick={() => removerItem(idx)} className="text-red-500">Remover</button>
            </div>
          ))}
        </div>

        {/* Outros Campos */}
        <input
          type="text"
          placeholder="Tema da festa (opcional)"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="border w-full p-2 rounded mt-2"
        />

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Data do evento</label>
            <input
              type="date"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Data do contrato</label>
            <input
              type="date"
              value={dataContrato}
              onChange={(e) => setDataContrato(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Horário início</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Horário término</label>
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Endereço do evento (opcional)"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="border w-full p-2 rounded mt-2"
        />

        <input
          type="text"
          placeholder="Nome do Buffet / Bairro"
          value={buffet}
          onChange={(e) => setBuffet(e.target.value)}
          className="border w-full p-2 rounded mt-2"
        />

        {/* Pagamentos */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Desconto</label>
            <input
              type="number"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Tipo</label>
            <select
              value={tipoDesconto}
              onChange={(e) => setTipoDesconto(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="valor">Valor</option>
              <option value="percentual">%</option>
            </select>
          </div>
          <div>
            <label>Entrada (R$)</label>
            <input
              type="number"
              value={entrada}
              onChange={(e) => setEntrada(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Forma de pagamento (entrada)</label>
            <select
              value={formaPagamentoEntrada}
              onChange={(e) => setFormaPagamentoEntrada(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option>Selecione</option>
              {formasPagamento.map((fp, i) => (
                <option key={i} value={fp}>{fp}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 font-semibold">
          Valor Total: R$ {valorComDesconto.toFixed(2)} <br />
          Valor Restante: R$ {valorRestante.toFixed(2)}
        </p>

        {/* Ações */}
        <div className="flex justify-end mt-6 gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-200">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 rounded bg-[#7ED957] text-white hover:bg-green-600"
          >
            Salvar Contrato
          </button>
        </div>
      </div>
    </div>
  );
}
