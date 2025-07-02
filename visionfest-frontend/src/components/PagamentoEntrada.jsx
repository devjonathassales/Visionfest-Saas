import React, { useEffect, useState } from "react";

export default function PagamentoEntrada({
  contasBancarias,
  cartoes,
  form,
  setForm,
}) {
  const [valorAjustado, setValorAjustado] = useState("0.00");

  useEffect(() => {
    const calcularValorLiquido = () => {
      let valor = parseFloat(form.valorEntrada || 0);
      const cartao = cartoes.find((c) => c.id === Number(form.cartaoId));

      if (
        ["credito", "debito"].includes(form.formaPagamentoEntrada) &&
        cartao &&
        !form.taxaRepassada
      ) {
        let taxa = 0;
        if (form.formaPagamentoEntrada === "credito") {
          taxa =
            form.tipoCredito === "parcelado"
              ? cartao.taxaParcelado || 0
              : cartao.taxaVista || 0;
        } else {
          taxa = cartao.taxaDebito || 0;
        }

        valor = valor * (1 - taxa / 100);
      }

      setForm((f) => ({ ...f, valorRecebido: valor }));
      setValorAjustado(valor.toFixed(2));
    };

    calcularValorLiquido();
  }, [
    form.valorEntrada,
    form.formaPagamentoEntrada,
    form.cartaoId,
    form.tipoCredito,
    form.taxaRepassada,
    cartoes,
    setForm,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50 space-y-3">
      <h3 className="text-md font-semibold text-[#7ED957] mb-2">
        Forma de Pagamento da Entrada
      </h3>

      {/* Forma de pagamento */}
      <div>
        <label className="block mb-1">Forma de Pagamento *</label>
        <select
          name="formaPagamentoEntrada"
          className="w-full border p-2 rounded"
          value={form.formaPagamentoEntrada}
          onChange={(e) => {
            const value = e.target.value;
            setForm((f) => ({
              ...f,
              formaPagamentoEntrada: value,
              contaBancariaId: "",
              cartaoId: "",
              tipoCredito: "",
              parcelasCredito: 1,
              taxaRepassada: false,
            }));
          }}
        >
          <option value="">Selecione</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="transferencia">Transferência</option>
        </select>
      </div>

      {/* Conta Bancária */}
      {["pix", "transferencia"].includes(form.formaPagamentoEntrada) && (
        <div>
          <label className="block mb-1">Conta Bancária *</label>
          <select
            name="contaBancariaId"
            className="w-full border p-2 rounded"
            value={form.contaBancariaId}
            onChange={handleChange}
          >
            <option value="">Selecione</option>
            {contasBancarias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco} - Ag. {c.agencia} / Cc. {c.conta}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cartão */}
      {["credito", "debito"].includes(form.formaPagamentoEntrada) && (
        <>
          <div>
            <label className="block mb-1">Cartão *</label>
            <select
              name="cartaoId"
              className="w-full border p-2 rounded"
              value={form.cartaoId}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.banco} – Débito: {c.taxaDebito ?? 0}% / Crédito:{" "}
                  {c.taxaVista ?? 0}% à vista, {c.taxaParcelado ?? 0}% parcelado
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="taxaRepassada"
              checked={form.taxaRepassada}
              onChange={handleChange}
            />
            Repassar taxa ao cliente?
          </label>
        </>
      )}

      {/* Tipo de crédito */}
      {form.formaPagamentoEntrada === "credito" && (
        <>
          <div>
            <label className="block mb-1">Tipo de Crédito *</label>
            <select
              name="tipoCredito"
              className="w-full border p-2 rounded"
              value={form.tipoCredito}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>

          {form.tipoCredito === "parcelado" && (
            <div>
              <label className="block mb-1">Parcelas *</label>
              <input
                type="number"
                min={1}
                name="parcelasCredito"
                className="w-full border p-2 rounded"
                value={form.parcelasCredito}
                onChange={handleChange}
              />
            </div>
          )}
        </>
      )}

      {/* Valor líquido */}
      {["credito", "debito"].includes(form.formaPagamentoEntrada) &&
        !form.taxaRepassada && (
          <div>
            <label className="block mb-1 text-sm">
              Valor líquido com taxa (aproximado)
            </label>
            <input
              type="text"
              readOnly
              className="w-full bg-gray-100 border rounded p-2"
              value={`R$ ${valorAjustado}`}
            />
          </div>
        )}
    </div>
  );
}
