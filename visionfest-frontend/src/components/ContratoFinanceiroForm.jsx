import React, { useState, useEffect } from "react";
import PagamentoEntrada from "./PagamentoEntrada";

const API_BASE = "http://localhost:5000/api";

export default function ContratoFinanceiroForm({
  contrato,
  onClose,
  onSalvar,
}) {
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  const [form, setForm] = useState({
    valorTotal: 0,
    desconto: { tipo: "valor", valor: "" },
    valorEntrada: "",
    formaPagamentoEntrada: "",
    contaBancariaId: "",
    cartaoId: "",
    tipoCredito: "",
    parcelasCredito: 1,
    taxaRepassada: false,
    parcelas: [],
  });

  useEffect(() => {
    async function carregarDados() {
      const [resFp, resCb, resCt] = await Promise.all([
        fetch(`${API_BASE}/contas-receber/formas-pagamento`),
        fetch(`${API_BASE}/contas-bancarias`),
        fetch(`${API_BASE}/cartoes-credito`),
      ]);
      setFormasPagamento(await resFp.json());
      setContasBancarias(await resCb.json());
      setCartoes(await resCt.json());
    }
    carregarDados();
  }, []);

  useEffect(() => {
    if (contrato) {
      const total = contrato.valorTotal || 0;
      const entrada = contrato.valorEntrada || 0;
      const restante = Math.max(total - entrada, 0);

      setForm((f) => ({
        ...f,
        valorTotal: total,
        desconto: {
          tipo: contrato.descontoPercentual ? "percentual" : "valor",
          valor: contrato.descontoPercentual || contrato.descontoValor || "",
        },
        valorEntrada: entrada || "",
        formaPagamentoEntrada: contrato.formaPagamentoEntrada || "",
        contaBancariaId: contrato.contaBancariaId || "",
        cartaoId: contrato.cartaoId || "",
        tipoCredito: contrato.tipoCredito || "",
        parcelasCredito: contrato.parcelasCredito || 1,
        taxaRepassada: contrato.taxaRepassada || false,
        parcelas:
          contrato.parcelasRestante?.map((p) => ({
            valor: p.valor,
            vencimento: p.vencimento?.slice(0, 10) || "",
          })) || (restante > 0 ? [{ valor: restante, vencimento: "" }] : []),
      }));
    }
  }, [contrato]);

  const parseCurrency = (val) => {
    if (typeof val === "string") {
      val = val.replace(",", ".").replace(/[^\d.]/g, "");
    }
    return parseFloat(val) || 0;
  };

  const descontoCalculado =
    form.desconto.tipo === "percentual"
      ? (form.valorTotal * parseCurrency(form.desconto.valor)) / 100
      : parseCurrency(form.desconto.valor);

  const totalComDesconto = Math.max(form.valorTotal - descontoCalculado, 0);
  const valorEntrada = parseCurrency(form.valorEntrada);
  const valorRestante = Math.max(totalComDesconto - valorEntrada, 0);
  const somaParcelas = form.parcelas.reduce(
    (acc, p) => acc + parseCurrency(p.valor),
    0
  );

  const podeAdicionarParcela = somaParcelas < valorRestante;

  const adicionarParcela = () => {
    const restante = valorRestante - somaParcelas;
    if (restante > 0) {
      setForm((f) => ({
        ...f,
        parcelas: [
          ...f.parcelas,
          { valor: restante.toFixed(2), vencimento: "" },
        ],
      }));
    }
  };

  const alterarParcela = (index, campo, valor) => {
    setForm((f) => {
      const parcelas = [...f.parcelas];
      if (campo === "valor") {
        let val = parseCurrency(valor);
        const restante =
          valorRestante - somaParcelas + parseCurrency(parcelas[index].valor);
        if (val > restante) val = restante;
        parcelas[index].valor = val;
      } else {
        parcelas[index][campo] = valor;
      }
      return { ...f, parcelas };
    });
  };

  const removerParcela = (index) => {
    setForm((f) => ({
      ...f,
      parcelas: f.parcelas.filter((_, i) => i !== index),
    }));
  };

  const validarFormulario = () => {
    if (valorEntrada < 0) return alert("Entrada não pode ser negativa.");
    if (parseCurrency(form.desconto.valor) < 0)
      return alert("Desconto inválido.");
    if (
      form.desconto.tipo === "percentual" &&
      parseCurrency(form.desconto.valor) > 100
    )
      return alert("Desconto percentual não pode exceder 100%.");
    if (somaParcelas > valorRestante)
      return alert("Parcelas maiores que valor restante.");

    for (let i = 0; i < form.parcelas.length; i++) {
      const p = form.parcelas[i];
      if (!p.valor || p.valor <= 0) return alert(`Parcela ${i + 1} inválida.`);
      if (!p.vencimento) return alert(`Parcela ${i + 1} sem vencimento.`);
    }

    if (valorEntrada > 0) {
      const precisaConta = [
        "pix",
        "deposito",
        "boleto",
        "transferencia",
      ].includes(form.formaPagamentoEntrada);
      const precisaCartao = ["cartao_credito", "cartao_debito"].includes(
        form.formaPagamentoEntrada
      );

      if (!form.formaPagamentoEntrada)
        return alert("Informe a forma de pagamento da entrada.");
      if (precisaConta && !form.contaBancariaId)
        return alert("Selecione a conta bancária.");
      if (precisaCartao && !form.cartaoId) return alert("Selecione o cartão.");
    }

    return true;
  };

  const handleSalvar = async () => {
    if (!contrato?.id) return alert("Contrato inválido.");
    if (!validarFormulario()) return;

    const payload = {
      clienteId: contrato.clienteId,
      dataEvento: contrato.dataEvento,
      horarioInicio: contrato.horarioInicio,
      horarioTermino: contrato.horarioTermino,
      localEvento: contrato.localEvento,
      nomeBuffet: contrato.nomeBuffet,
      temaFesta: contrato.temaFesta,
      produtos: contrato.produtosSelecionados || [],
      valorTotal: form.valorTotal,
      descontoValor:
        form.desconto.tipo === "valor" ? parseCurrency(form.desconto.valor) : 0,
      descontoPercentual:
        form.desconto.tipo === "percentual"
          ? parseCurrency(form.desconto.valor)
          : 0,
      valorEntrada,
      valorRestante,
      parcelasRestante: form.parcelas,
      dataContrato: contrato.dataContrato,
      formaPagamentoEntrada: form.formaPagamentoEntrada,
      contaBancariaId: form.contaBancariaId,
      cartaoId: form.cartaoId,
      tipoCredito: form.tipoCredito,
      parcelasCredito: form.parcelasCredito,
      taxaRepassada: form.taxaRepassada,
    };

    try {
      const res = await fetch(`${API_BASE}/contratos/${contrato.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar financeiro.");
      const data = await res.json();
      onSalvar(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar informações financeiras.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 overflow-auto z-50">
      <div className="bg-white rounded p-6 max-w-3xl w-full mx-auto mt-10 mb-10 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-[#7ED957]">
          Financeiro do Contrato
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Tipo de Desconto</label>
            <select
              value={form.desconto.tipo}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  desconto: { ...f.desconto, tipo: e.target.value },
                }))
              }
              className="border rounded w-full p-1"
            >
              <option value="valor">Valor (R$)</option>
              <option value="percentual">Percentual (%)</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">Valor do Desconto</label>
            <input
              type="text"
              value={form.desconto.valor}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  desconto: {
                    ...f.desconto,
                    valor: e.target.value,
                  },
                }))
              }
              className="border rounded w-full p-1"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold">Valor de Entrada</label>
          <input
            type="text"
            value={form.valorEntrada}
            onChange={(e) =>
              setForm((f) => ({ ...f, valorEntrada: e.target.value }))
            }
            className="border rounded w-full p-1"
            inputMode="decimal"
          />
        </div>

        {valorEntrada > 0 && (
          <PagamentoEntrada
            formasPagamento={formasPagamento}
            contasBancarias={contasBancarias}
            cartoes={cartoes}
            form={form}
            setForm={setForm}
          />
        )}

        <div>
          <h4 className="font-semibold">
            Parcelas (Restante: R$ {valorRestante.toFixed(2)} / Somado: R${" "}
            {somaParcelas.toFixed(2)})
          </h4>

          {form.parcelas.map((p, i) => (
            <div key={i} className="flex flex-wrap gap-4 mt-2 items-end">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Valor"
                value={p.valor}
                onChange={(e) => alterarParcela(i, "valor", e.target.value)}
                className="border rounded w-24 p-1"
              />
              <input
                type="date"
                value={p.vencimento}
                onChange={(e) =>
                  alterarParcela(i, "vencimento", e.target.value)
                }
                className="border rounded p-1"
              />
              <button
                type="button"
                onClick={() => removerParcela(i)}
                className="text-red-600 font-bold"
                title="Remover parcela"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={adicionarParcela}
            disabled={!podeAdicionarParcela}
            className={`mt-2 px-3 py-1 rounded ${
              podeAdicionarParcela
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Adicionar Parcela
          </button>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 bg-[#7ED957] text-white rounded"
          >
            Salvar Financeiro
          </button>
        </div>
      </div>
    </div>
  );
}
