import React, { useState, useEffect } from "react";

const produtosMock = [
  { id: 1, nome: "Cadeira", preco: 10 },
  { id: 2, nome: "Mesa Redonda", preco: 25 },
  { id: 3, nome: "Decoração Tema Safari", preco: 300 },
];

const formasPagamentoMock = ["Pix", "Dinheiro", "Cartão de Crédito", "Boleto"];

export default function ContratoForm({ onClose }) {
  const [cliente, setCliente] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [tema, setTema] = useState("");
  const [cerimonialista, setCerimonialista] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [enderecoEvento, setEnderecoEvento] = useState("");
  const [buffet, setBuffet] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [entrada, setEntrada] = useState(0);
  const [formaEntrada, setFormaEntrada] = useState("");
  const [parcelas, setParcelas] = useState([]);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(0);
  const [dataContrato, setDataContrato] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const adicionarProduto = (produtoId) => {
    const produto = produtosMock.find((p) => p.id === parseInt(produtoId));
    if (produto) {
      setProdutosSelecionados([
        ...produtosSelecionados,
        { ...produto, quantidade: 1 },
      ]);
    }
  };

  const alterarQuantidade = (index, quantidade) => {
    const novos = [...produtosSelecionados];
    novos[index].quantidade = parseInt(quantidade);
    setProdutosSelecionados(novos);
  };

  const removerProduto = (index) => {
    const novos = [...produtosSelecionados];
    novos.splice(index, 1);
    setProdutosSelecionados(novos);
  };

  const valorTotal = produtosSelecionados.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );
  const valorDesconto =
    tipoDesconto === "porcentagem" ? (valorTotal * desconto) / 100 : desconto;
  const valorFinal = valorTotal - valorDesconto;
  const restante = valorFinal - entrada;

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    const novaLista = [];
    if (quantidadeParcelas > 0) {
      const valorParcela = restante / quantidadeParcelas;
      for (let i = 0; i < quantidadeParcelas; i++) {
        novaLista.push({
          valor: valorParcela.toFixed(2),
          vencimento: "",
        });
      }
    }
    setParcelas(novaLista);
  }, [quantidadeParcelas, restante]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl p-6 rounded shadow overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-600">Novo Contrato</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 font-bold text-xl"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Tema da Festa (opcional)"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Cerimonialista (opcional)"
            value={cerimonialista}
            onChange={(e) => setCerimonialista(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="date"
            placeholder="Data do Evento"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Horário de Início"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Horário de Término"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Buffet/Bairro"
            value={buffet}
            onChange={(e) => setBuffet(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Endereço do Evento (opcional)"
            value={enderecoEvento}
            onChange={(e) => setEnderecoEvento(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div className="mt-6">
          <label className="block mb-2 font-semibold">
            Adicionar Produto/Serviço:
          </label>
          <select
            onChange={(e) => adicionarProduto(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Selecione um produto</option>
            {produtosMock.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} - R${p.preco}
              </option>
            ))}
          </select>

          <div className="mt-4 space-y-2">
            {produtosSelecionados.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="w-1/3">{item.nome}</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => alterarQuantidade(index, e.target.value)}
                  className="w-1/4 border p-1 rounded"
                />
                <button
                  onClick={() => removerProduto(index)}
                  className="text-red-500"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Desconto:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                className="border p-2 rounded w-full"
              />
              <select
                value={tipoDesconto}
                onChange={(e) => setTipoDesconto(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="valor">R$</option>
                <option value="porcentagem">%</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Valor de Entrada:
            </label>
            <input
              type="number"
              value={entrada}
              onChange={(e) => setEntrada(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Forma de Pagamento da Entrada:
            </label>
            <select
              value={formaEntrada}
              onChange={(e) => setFormaEntrada(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Selecione</option>
              {formasPagamentoMock.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Parcelas do Restante:
            </label>
            <input
              type="number"
              value={quantidadeParcelas}
              onChange={(e) => setQuantidadeParcelas(Number(e.target.value))}
              className="border p-2 rounded w-full"
              placeholder="Número de parcelas"
            />
          </div>
        </div>

        {parcelas.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Vencimentos:</h3>
            {parcelas.map((parcela, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <span>
                  Parcela {index + 1} - R$ {parcela.valor}
                </span>
                <input
                  type="date"
                  className="border p-1 rounded"
                  onChange={(e) => {
                    const novas = [...parcelas];
                    novas[index].vencimento = e.target.value;
                    setParcelas(novas);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <label className="block font-semibold mb-1">Data do Contrato:</label>
          <input
            type="date"
            value={dataContrato}
            onChange={(e) => setDataContrato(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => alert("Contrato salvo com sucesso!")}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Salvar Contrato
          </button>
        </div>
      </div>
    </div>
  );
}
