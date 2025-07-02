import React, { useState, useEffect } from "react";
import Select from "react-select";

const API_BASE = "http://localhost:5000/api";

export default function ContratoForm({ onClose, onContratoSalvo, contrato }) {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);

  // Estado para controle do produto selecionado e quantidade temporária antes de adicionar
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);

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

  // Carregar clientes e produtos
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

  // Preenche os campos se estiver editando
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
        valorTotal: 0, // Será recalculado
      });
    }
  }, [contrato]);

  // Recalcular valor total sempre que produtosSelecionados mudar
  useEffect(() => {
    const total = form.produtosSelecionados.reduce(
      (acc, p) => acc + p.valor * p.quantidade,
      0
    );
    setForm((f) => ({ ...f, valorTotal: total }));
  }, [form.produtosSelecionados]);

  // Função para adicionar produto selecionado com a quantidade informada
  const adicionarProduto = () => {
    if (!produtoSelecionado) {
      alert("Selecione um produto para adicionar.");
      return;
    }
    if (!quantidadeProduto || quantidadeProduto < 1) {
      alert("Informe uma quantidade válida (mínimo 1).");
      return;
    }

    setForm((f) => {
      const existente = f.produtosSelecionados.find(
        (p) => p.produtoId === produtoSelecionado.value
      );

      if (existente) {
        // Atualiza a quantidade somando
        return {
          ...f,
          produtosSelecionados: f.produtosSelecionados.map((p) =>
            p.produtoId === produtoSelecionado.value
              ? { ...p, quantidade: p.quantidade + quantidadeProduto }
              : p
          ),
        };
      }

      // Adiciona novo produto
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
            quantidade: quantidadeProduto,
          },
        ],
      };
    });

    // Reseta seleção e quantidade
    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
  };

  // Alterar quantidade do produto na lista
  const alterarQuantidadeProduto = (produtoId, novaQuantidade) => {
    if (novaQuantidade < 1) return;
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.map((p) =>
        p.produtoId === produtoId ? { ...p, quantidade: novaQuantidade } : p
      ),
    }));
  };

  // Remover produto da lista
  const removerProduto = (produtoId) => {
    setForm((f) => ({
      ...f,
      produtosSelecionados: f.produtosSelecionados.filter(
        (p) => p.produtoId !== produtoId
      ),
    }));
  };

  // Validação simples antes do submit
  const validarFormulario = () => {
    if (!form.clienteId) {
      alert("Selecione um cliente.");
      return false;
    }
    if (form.produtosSelecionados.length === 0) {
      alert("Adicione pelo menos um produto/serviço.");
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

    const produtosPayload = form.produtosSelecionados.map((p) => ({
      produtoId: p.produtoId,
      quantidade: p.quantidade,
    }));

    const payload = {
      clienteId: form.clienteId,
      corTema: form.corTema,
      dataEvento: form.dataEvento,
      horarioInicio: form.horarioInicio,
      horarioTermino: form.horarioTermino,
      enderecoEvento: form.enderecoEvento,
      nomeBuffet: form.nomeBuffet,
      dataContrato: form.dataContrato,
      produtos: produtosPayload,
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

      if (!res.ok) throw new Error("Falha ao salvar contrato.");

      const data = await res.json();
      onContratoSalvo(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar contrato.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center pt-20 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded p-6 max-w-3xl w-full space-y-4 shadow-lg"
      >
        <h2 className="text-xl font-bold text-[#7ED957]">
          {contrato ? "Editar Contrato" : "Novo Contrato"}
        </h2>

        <div>
          <label className="block font-semibold mb-1">Cliente *</label>
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
            placeholder="Selecione um cliente"
            isClearable
          />
        </div>

        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="block font-semibold mb-1">Adicionar Produto</label>
            <Select
              options={produtos.map((p) => ({
                value: p.id,
                label: `${p.nome} - R$ ${p.valor.toFixed(2)}`,
              }))}
              value={produtoSelecionado}
              onChange={setProdutoSelecionado}
              placeholder="Selecione um produto"
              isClearable
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantidadeProduto}
              onChange={(e) =>
                setQuantidadeProduto(parseInt(e.target.value) || 1)
              }
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={adicionarProduto}
              className="bg-[#7ED957] text-white px-4 py-2 rounded"
            >
              Adicionar
            </button>
          </div>
        </div>

        {form.produtosSelecionados.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Produtos Selecionados</h4>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Valor Unit.</th>
                  <th className="text-left p-2">Quantidade</th>
                  <th className="text-left p-2">Subtotal</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {form.produtosSelecionados.map((p) => (
                  <tr key={p.produtoId} className="border-b border-gray-200">
                    <td className="p-2">{p.nome}</td>
                    <td className="p-2">R$ {p.valor.toFixed(2)}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={p.quantidade}
                        onChange={(e) =>
                          alterarQuantidadeProduto(
                            p.produtoId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="border rounded px-1 py-0.5 w-16"
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
                        title="Remover produto"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Cor/Tema</label>
            <input
              type="text"
              value={form.corTema}
              onChange={(e) =>
                setForm((f) => ({ ...f, corTema: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block font-semibold">Nome do Buffet *</label>
            <input
              type="text"
              required
              value={form.nomeBuffet}
              onChange={(e) =>
                setForm((f) => ({ ...f, nomeBuffet: e.target.value }))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input
            type="date"
            value={form.dataEvento}
            onChange={(e) =>
              setForm((f) => ({ ...f, dataEvento: e.target.value }))
            }
            className="border rounded px-2 py-1"
          />
          <input
            type="time"
            value={form.horarioInicio}
            onChange={(e) =>
              setForm((f) => ({ ...f, horarioInicio: e.target.value }))
            }
            className="border rounded px-2 py-1"
          />
          <input
            type="time"
            value={form.horarioTermino}
            onChange={(e) =>
              setForm((f) => ({ ...f, horarioTermino: e.target.value }))
            }
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block font-semibold">Endereço do Evento</label>
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
          <label className="block font-semibold">Data do Contrato</label>
          <input
            type="date"
            value={form.dataContrato}
            onChange={(e) =>
              setForm((f) => ({ ...f, dataContrato: e.target.value }))
            }
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="font-bold">Valor Total</label>
          <div className="text-lg font-semibold">
            R$ {form.valorTotal.toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
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
