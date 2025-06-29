import React, { useState, useEffect } from "react";
import Select from "react-select";
import PagamentoEntrada from "./PagamentoEntrada";

const API_BASE = "http://localhost:5000/api";

export default function ContratoForm({ onClose, onSalvar }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  const [form, setForm] = useState({
    clienteId: "",
    produtosSelecionados: [],
    corTema: "",
    dataEvento: "",
    horarioInicio: "",
    horarioTermino: "",
    enderecoEvento: "",
    nomeBuffet: "",
    desconto: { tipo: "valor", valor: 0 },
    valorTotal: 0,
    valorEntrada: 0,
    formaPagamentoEntrada: "",
    contaBancariaId: "",
    cartaoId: "",
    tipoCredito: "",
    parcelasCredito: 1,
    taxaRepassada: false,
    valorRestante: 0,
    parcelas: [],
    dataContrato: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    async function fetchDados() {
      try {
        const [rc, rp, rf, rb, rct] = await Promise.all([
          fetch(`${API_BASE}/clientes`),
          fetch(`${API_BASE}/produtos`),
          fetch(`${API_BASE}/contas-receber/formas-pagamento`),
          fetch(`${API_BASE}/contas-bancarias`),
          fetch(`${API_BASE}/cartoes-credito`),
        ]);

        if (!rc.ok || !rp.ok || !rf.ok || !rb.ok || !rct.ok) {
          throw new Error("Erro ao carregar dados do servidor");
        }

        const clientesJson = await rc.json();
        const produtosJson = await rp.json();
        const formasPagamentoJson = await rf.json();
        const contasBancariasJson = await rb.json();
        const cartoesJson = await rct.json();

        setClientes(clientesJson);
        setProdutos(produtosJson);
        setFormasPagamento(Array.isArray(formasPagamentoJson) ? formasPagamentoJson : []);
        setContasBancarias(contasBancariasJson);
        setCartoes(cartoesJson);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setFormasPagamento([]); // evita erro no render
      }
    }
    fetchDados();
  }, []);

  useEffect(() => {
    const totalProdutos = form.produtosSelecionados.reduce(
      (acc, item) => acc + item.valor * item.quantidade,
      0
    );
    const descontoVal =
      form.desconto.tipo === "percentual"
        ? (totalProdutos * form.desconto.valor) / 100
        : form.desconto.valor;
    const valorTotal = Math.max(totalProdutos - descontoVal, 0);
    const valorRestante = Math.max(valorTotal - form.valorEntrada, 0);
    setForm((f) => ({ ...f, valorTotal, valorRestante }));
  }, [form.produtosSelecionados, form.desconto, form.valorEntrada]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("desconto.")) {
      const key = name.split(".")[1];
      setForm((f) => ({
        ...f,
        desconto: {
          ...f.desconto,
          [key]: name === "desconto.valor" ? Number(value) : value,
        },
      }));
    } else if (name === "taxaRepassada") {
      setForm((f) => ({ ...f, taxaRepassada: checked }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const adicionarProduto = (produto) => {
    setForm((f) => {
      const existe = f.produtosSelecionados.find((p) => p.produtoId === produto.id);
      if (existe) {
        return {
          ...f,
          produtosSelecionados: f.produtosSelecionados.map((p) =>
            p.produtoId === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
          ),
        };
      }
      return {
        ...f,
        produtosSelecionados: [
          ...f.produtosSelecionados,
          {
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: 1,
            valor: produto.valor,
          },
        ],
      };
    });
  };

  const removerProduto = (produtoId) => {
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.filter((p) => p.produtoId !== produtoId),
    }));
  };

  const alterarQuantidade = (produtoId, quantidade) => {
    if (quantidade < 1) return;
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.map((p) =>
        p.produtoId === produtoId ? { ...p, quantidade } : p
      ),
    }));
  };

  const alterarParcela = (index, campo, valor) => {
    setForm((f) => {
      const ps = [...f.parcelas];
      ps[index] = { ...ps[index], [campo]: valor };
      return { ...f, parcelas: ps };
    });
  };

  const adicionarParcela = () =>
    setForm((f) => ({
      ...f,
      parcelas: [...f.parcelas, { valor: "", vencimento: "" }],
    }));

  const removerParcela = (i) =>
    setForm((f) => ({
      ...f,
      parcelas: f.parcelas.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.clienteId || !form.dataEvento || form.produtosSelecionados.length === 0) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    if (form.valorEntrada > 0 && !form.formaPagamentoEntrada) {
      alert("Selecione a forma de pagamento da entrada.");
      return;
    }

    const payloadContrato = {
      clienteId: form.clienteId,
      dataEvento: form.dataEvento,
      horarioInicio: form.horarioInicio,
      horarioTermino: form.horarioTermino,
      localEvento: form.enderecoEvento,
      nomeBuffet: form.nomeBuffet,
      temaFesta: form.corTema,
      produtos: form.produtosSelecionados.map((p) => ({
        produtoId: p.produtoId,
        quantidade: p.quantidade,
      })),
      valorTotal: form.valorTotal,
      descontoValor: form.desconto.tipo === "valor" ? form.desconto.valor : 0,
      descontoPercentual: form.desconto.tipo === "percentual",
      valorEntrada: form.valorEntrada,
      valorRestante: form.valorRestante,
      parcelasRestante: form.parcelas,
      dataContrato: form.dataContrato,
    };

    try {
      const res = await fetch(`${API_BASE}/contratos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadContrato),
      });
      const contrato = await res.json();

      if (form.valorEntrada > 0) {
        const pagamento = {
          formaPagamento: form.formaPagamentoEntrada,
          contaBancariaId: form.contaBancariaId || null,
          cartaoId: form.cartaoId || null,
          tipoCredito: form.tipoCredito || null,
          parcelas: form.tipoCredito === "parcelado" ? form.parcelasCredito : null,
          taxaRepassada: form.taxaRepassada,
          valorRecebido: form.valorEntrada,
        };

        await fetch(`${API_BASE}/contas-receber/${contrato.id}/receber`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pagamento),
        });
      }

      onSalvar(contrato);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar contrato: " + err.message);
    }
  };

  // Componente interno para busca e seleção de produtos
  function ProdutoSearch({ produtos, onAdicionar }) {
    const [query, setQuery] = useState("");
    const [filtrados, setFiltrados] = useState([]);

    useEffect(() => {
      if (!query) {
        setFiltrados([]);
        return;
      }
      const q = query.toLowerCase();
      setFiltrados(produtos.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 10));
    }, [query, produtos]);

    return (
      <div className="relative">
        <input
          type="text"
          placeholder="Busque um produto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
        />
        {filtrados.length > 0 && (
          <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-48 overflow-auto rounded mt-1">
            {filtrados.map((p) => (
              <li
                key={p.id}
                onClick={() => {
                  onAdicionar(p);
                  setQuery("");
                  setFiltrados([]);
                }}
                className="cursor-pointer px-3 py-2 hover:bg-green-50"
              >
                {p.nome} — R$ {p.valor.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-20 z-50 overflow-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-auto max-h-[90vh] space-y-6"
      >
        <h2 className="text-xl font-semibold text-[#7ED957] mb-4">Novo Contrato</h2>

        {/* Cliente */}
        <div>
          <label className="block font-semibold mb-1">Cliente *</label>
          <Select
            options={clientes.map((c) => ({
              value: c.id,
              label: c.nome,
            }))}
            value={
              clientes
                .map((c) => ({ value: c.id, label: c.nome }))
                .find((op) => op.value === form.clienteId) || null
            }
            onChange={(selectedOption) =>
              setForm((f) => ({
                ...f,
                clienteId: selectedOption ? selectedOption.value : "",
              }))
            }
            placeholder="Selecione ou pesquise um cliente"
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        {/* Produtos / Serviços */}
        <div>
          <label className="block font-semibold mb-2">Produtos / Serviços *</label>
          <Select
            options={produtos.map((p) => ({
              value: p.id,
              label: `${p.nome} — R$ ${p.valor.toFixed(2)}`,
              produto: p,
            }))}
            onChange={(selectedOption) => {
              if (selectedOption?.produto) {
                adicionarProduto(selectedOption.produto);
              }
            }}
            placeholder="Selecione ou pesquise um produto"
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
          />

          {/* Lista de produtos selecionados */}
          {form.produtosSelecionados.length > 0 && (
            <table className="w-full mt-4 text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Produto</th>
                  <th className="border px-2 py-1">Qtd</th>
                  <th className="border px-2 py-1">Valor Unit.</th>
                  <th className="border px-2 py-1">Subtotal</th>
                  <th className="border px-2 py-1">Remover</th>
                </tr>
              </thead>
              <tbody>
                {form.produtosSelecionados.map((p) => (
                  <tr key={p.produtoId}>
                    <td className="border px-2 py-1">{p.nome}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        value={p.quantidade}
                        onChange={(e) => alterarQuantidade(p.produtoId, +e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">R$ {p.valor.toFixed(2)}</td>
                    <td className="border px-2 py-1 text-center">
                      R$ {(p.valor * p.quantidade).toFixed(2)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removerProduto(p.produtoId)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cor ou tema da festa */}
        <div>
          <label className="block font-semibold mb-1">Cor/Tema da Festa (opcional)</label>
          <input
            type="text"
            name="corTema"
            value={form.corTema}
            onChange={handleChange}
            placeholder="Ex: Azul e Branco"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
          />
        </div>

        {/* Datas e horários */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Data do Evento *</label>
            <input
              type="date"
              name="dataEvento"
              value={form.dataEvento}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Horário Início *</label>
            <input
              type="time"
              name="horarioInicio"
              value={form.horarioInicio}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Horário Término</label>
            <input
              type="time"
              name="horarioTermino"
              value={form.horarioTermino}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
        </div>

        {/* Endereço e buffet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Endereço do Evento (opcional)</label>
            <input
              type="text"
              name="enderecoEvento"
              value={form.enderecoEvento}
              onChange={handleChange}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Nome do Buffet/Bairro</label>
            <input
              type="text"
              name="nomeBuffet"
              value={form.nomeBuffet}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>
        </div>

        {/* Valores, desconto e entrada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block font-semibold mb-1">Desconto</label>
            <div className="flex gap-2">
              <select
                name="desconto.tipo"
                value={form.desconto.tipo}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#7ED957]"
              >
                <option value="valor">Valor (R$)</option>
                <option value="percentual">Percentual (%)</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.desconto.valor}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    desconto: { ...f.desconto, valor: Number(e.target.value) },
                  }))
                }
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:border-[#7ED957]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Valor Total (R$)</label>
            <input
              type="text"
              value={form.valorTotal.toFixed(2)}
              readOnly
              className="border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Valor Entrada (R$)</label>
            <input
              type="number"
              min="0"
              max={form.valorTotal}
              name="valorEntrada"
              value={form.valorEntrada}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#7ED957]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Valor Restante (R$)</label>
            <input
              type="text"
              value={form.valorRestante.toFixed(2)}
              readOnly
              className="border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Forma de pagamento da entrada */}
        {form.valorEntrada > 0 && (
          <PagamentoEntrada
            formasPagamento={formasPagamento}
            contasBancarias={contasBancarias}
            cartoes={cartoes}
            form={form}
            setForm={setForm}
          />
        )}

        {/* Parcelas para o valor restante */}
        {form.valorRestante > 0 && (
          <div>
            <label className="block font-semibold mb-2">Parcelas do valor restante</label>

            {form.parcelas.map((p, i) => (
              <div key={i} className="flex gap-4 mb-2 items-end">
                <div>
                  <label className="block text-sm font-semibold">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.valor}
                    onChange={(e) => alterarParcela(i, "valor", Number(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:border-[#7ED957]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold">Vencimento</label>
                  <input
                    type="date"
                    value={p.vencimento}
                    onChange={(e) => alterarParcela(i, "vencimento", e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-40 focus:outline-none focus:border-[#7ED957]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removerParcela(i)}
                  className="text-red-600 font-semibold"
                >
                  Remover
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={adicionarParcela}
              className="bg-[#7ED957] text-white rounded px-4 py-2 mt-2 hover:bg-green-600"
            >
              Adicionar Parcela
            </button>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7ED957] text-white rounded hover:bg-green-600"
          >
            Salvar Contrato
          </button>
        </div>
      </form>
    </div>
  );
}
