import React, { useState, useEffect } from "react";
import Select from "react-select";

const API_BASE = "http://localhost:5000/api";

export default function ContratoForm({ onClose, onContratoSalvo, contrato }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState("");

  const [form, setForm] = useState({
    clienteId: "",
    produtosSelecionados: [],
    corTema: "",
    dataEvento: "",
    horarioInicio: "",
    horarioTermino: "",
    enderecoEvento: "",
    nomeBuffet: "",
    dataContrato: new Date().toISOString().slice(0, 10),
    valorTotal: 0,
  });

  useEffect(() => {
    async function carregarDados() {
      const [resClientes, resProdutos] = await Promise.all([
        fetch(`${API_BASE}/clientes`),
        fetch(`${API_BASE}/produtos`),
      ]);
      const [clientesJson, produtosJson] = await Promise.all([
        resClientes.json(),
        resProdutos.json(),
      ]);
      setClientes(clientesJson);
      setProdutos(produtosJson);
    }
    carregarDados();
  }, []);

  useEffect(() => {
    if (contrato) {
      setForm({
        clienteId: contrato.clienteId,
        produtosSelecionados:
          contrato.Produtos?.map((p) => ({
            produtoId: p.id,
            nome: p.nome,
            valor: p.valor,
            quantidade: p.ContratoProduto?.quantidade || 1,
          })) || [],
        corTema: contrato.corTema || "",
        dataEvento: contrato.dataEvento || "",
        horarioInicio: contrato.horarioInicio || "",
        horarioTermino: contrato.horarioTermino || "",
        enderecoEvento: contrato.enderecoEvento || "",
        nomeBuffet: contrato.nomeBuffet || "",
        dataContrato:
          contrato.dataContrato || new Date().toISOString().slice(0, 10),
        valorTotal: 0,
      });
    }
  }, [contrato]);

  useEffect(() => {
    const total = form.produtosSelecionados.reduce(
      (acc, p) => acc + p.valor * p.quantidade,
      0
    );
    setForm((f) => ({ ...f, valorTotal: total }));
  }, [form.produtosSelecionados]);

  const adicionarProduto = () => {
    const quantidade = parseInt(quantidadeProduto);
    if (!produtoSelecionado || isNaN(quantidade) || quantidade < 1) {
      alert("Selecione um produto e quantidade válida.");
      return;
    }

    setForm((f) => {
      const existente = f.produtosSelecionados.find(
        (p) => p.produtoId === produtoSelecionado.value
      );

      if (existente) {
        return {
          ...f,
          produtosSelecionados: f.produtosSelecionados.map((p) =>
            p.produtoId === produtoSelecionado.value
              ? { ...p, quantidade: p.quantidade + quantidade }
              : p
          ),
        };
      }

      return {
        ...f,
        produtosSelecionados: [
          ...f.produtosSelecionados,
          {
            produtoId: produtoSelecionado.value,
            nome: produtoSelecionado.label.split(" - R$")[0],
            valor:
              produtos.find((p) => p.id === produtoSelecionado.value)?.valor ||
              0,
            quantidade,
          },
        ],
      };
    });

    setProdutoSelecionado(null);
    setQuantidadeProduto("");
  };

  const alterarQuantidadeProduto = (produtoId, novaQuantidade) => {
    const qtd = parseInt(novaQuantidade);
    if (isNaN(qtd) || qtd < 1) return;
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.map((p) =>
        p.produtoId === produtoId ? { ...p, quantidade: qtd } : p
      ),
    }));
  };

  const removerProduto = (produtoId) => {
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.filter(
        (p) => p.produtoId !== produtoId
      ),
    }));
  };

  const validarFormulario = () => {
    if (!form.clienteId) {
      alert("Selecione um cliente.");
      return false;
    }
    if (form.produtosSelecionados.length === 0) {
      alert("Adicione pelo menos um produto.");
      return false;
    }
    if (!form.nomeBuffet.trim()) {
      alert("Informe o nome do buffet.");
      return false;
    }
    if (!form.dataEvento) {
      alert("Informe a data do evento.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const payload = {
      clienteId: form.clienteId,
      corTema: form.corTema,
      dataEvento: form.dataEvento,
      horarioInicio: form.horarioInicio,
      horarioTermino: form.horarioTermino,
      enderecoEvento: form.enderecoEvento,
      nomeBuffet: form.nomeBuffet,
      dataContrato: form.dataContrato,
      produtos: form.produtosSelecionados.map((p) => ({
        produtoId: p.produtoId,
        quantidade: p.quantidade,
      })),
      valorTotal: form.valorTotal,
    };

    try {
      const url = contrato
        ? `${API_BASE}/contratos/${contrato.id}`
        : `${API_BASE}/contratos`;
      const method = contrato ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar contrato.");
      const data = await res.json();
      onContratoSalvo(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar contrato.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black bg-opacity-30 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-4 w-full max-w-4xl mx-2 space-y-4"
      >
        <h2 className="text-lg md:text-xl font-bold text-[#7ED957]">
          {contrato ? "Editar Contrato" : "Novo Contrato"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold">Cliente *</label>
            <Select
              options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              value={
                clientes
                  .map((c) => ({ value: c.id, label: c.nome }))
                  .find((op) => op.value === form.clienteId) || null
              }
              onChange={(op) =>
                setForm((f) => ({ ...f, clienteId: op?.value || "" }))
              }
              isClearable
              placeholder="Selecione um Cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Cor/Tema</label>
            <input
              type="text"
              value={form.corTema}
              onChange={(e) =>
                setForm((f) => ({ ...f, corTema: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold">Produto</label>
            <Select
              options={produtos.map((p) => ({
                value: p.id,
                label: `${p.nome} - R$ ${p.valor.toFixed(2)}`,
              }))}
              value={produtoSelecionado}
              onChange={setProdutoSelecionado}
              isClearable
              placeholder="Selecione um Produto"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantidadeProduto}
              onChange={(e) => setQuantidadeProduto(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <button
            type="button"
            onClick={adicionarProduto}
            className="bg-[#7ED957] text-white rounded px-4 py-2"
          >
            Adicionar
          </button>
        </div>

        {form.produtosSelecionados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Qtd</th>
                  <th className="text-left p-2">Subtotal</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {form.produtosSelecionados.map((p) => (
                  <tr key={p.produtoId} className="border-b">
                    <td className="p-2">{p.nome}</td>
                    <td className="p-2">R$ {p.valor.toFixed(2)}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.quantidade}
                        onChange={(e) =>
                          alterarQuantidadeProduto(p.produtoId, e.target.value)
                        }
                        className="w-16 border rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="p-2">
                      R$ {(p.valor * p.quantidade).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removerProduto(p.produtoId)}
                        className="text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold">
              Data do Evento *
            </label>
            <input
              type="date"
              value={form.dataEvento}
              onChange={(e) =>
                setForm((f) => ({ ...f, dataEvento: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">
              Horário de Início
            </label>
            <input
              type="time"
              value={form.horarioInicio}
              onChange={(e) =>
                setForm((f) => ({ ...f, horarioInicio: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">
              Horário de Término
            </label>
            <input
              type="time"
              value={form.horarioTermino}
              onChange={(e) =>
                setForm((f) => ({ ...f, horarioTermino: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold">
            Endereço do Evento
          </label>
          <input
            type="text"
            value={form.enderecoEvento}
            onChange={(e) =>
              setForm((f) => ({ ...f, enderecoEvento: e.target.value }))
            }
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">
            Nome do Buffet *
          </label>
          <input
            type="text"
            value={form.nomeBuffet}
            required
            onChange={(e) =>
              setForm((f) => ({ ...f, nomeBuffet: e.target.value }))
            }
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <label className="block text-sm font-semibold">
              Data do Contrato
            </label>
            <input
              type="date"
              value={form.dataContrato}
              onChange={(e) =>
                setForm((f) => ({ ...f, dataContrato: e.target.value }))
              }
              className="border rounded px-2 py-1 w-full md:w-auto"
            />
          </div>
          <div className="text-lg font-semibold mt-2 md:mt-0">
            Valor Total: R$ {form.valorTotal.toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7ED957] text-white rounded"
          >
            {contrato ? "Atualizar Contrato" : "Salvar Contrato"}
          </button>
        </div>
      </form>
    </div>
  );
}
