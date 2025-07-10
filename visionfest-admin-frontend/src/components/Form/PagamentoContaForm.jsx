import React, { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import api from "../../utils/api";

export default function PagamentoContaForm({
  conta,
  onClose,
  onConfirm,
  disabled,
}) {
  const modalRef = useRef();
  const [contasBancarias, setContasBancarias] = useState([]);
  const [dados, setDados] = useState({
    dataPagamento: new Date().toISOString().substring(0, 10),
    valorPago: conta.valor,
    observacao: "",
    formaPagamento: "dinheiro",
    contaBancariaId: "",
    tipoCredito: "avista",
    parcelas: 1,
    novaDataVencimento: "",
  });

  // Carregar contas bancárias ao abrir o modal
  useEffect(() => {
    api
      .get("/contas-bancarias")
      .then((res) => setContasBancarias(res.data))
      .catch((err) => console.error("Erro ao carregar contas bancárias:", err));
  }, []);

  // Fechar modal ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [onClose]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados((d) => ({ ...d, [name]: value }));
  };

  const handleConfirmar = () => {
    if (!dados.dataPagamento || !dados.valorPago || !dados.formaPagamento) {
      alert(
        "Preencha os campos obrigatórios: data, valor e forma de pagamento."
      );
      return;
    }

    if (
      dados.formaPagamento === "credito" &&
      dados.tipoCredito === "parcelado" &&
      (!dados.parcelas || dados.parcelas < 1)
    ) {
      alert("Informe o número válido de parcelas.");
      return;
    }

    // Conta bancária obrigatória para pix, débito e crédito parcelado
    if (
      (dados.formaPagamento === "pix" ||
        dados.formaPagamento === "debito" ||
        (dados.formaPagamento === "credito" && dados.tipoCredito === "parcelado")) &&
      !dados.contaBancariaId
    ) {
      alert("Selecione a conta bancária.");
      return;
    }

    onConfirm(dados);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-green-600">Baixa de Conta</h2>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Descrição:</span>
            <span>{conta.descricao}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Valor Original:</span>
            <span>R$ {parseFloat(conta.valor).toFixed(2)}</span>
          </div>

          <input
            type="date"
            name="dataPagamento"
            value={dados.dataPagamento}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="number"
            name="valorPago"
            value={dados.valorPago}
            onChange={handleChange}
            placeholder="Valor Pago (R$)"
            className="w-full border rounded px-3 py-2"
            min="0"
          />

          <select
            name="formaPagamento"
            value={dados.formaPagamento}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>

          {/* Exibir contas bancárias quando forma de pagamento for PIX, Débito ou Crédito Parcelado */}
          {(dados.formaPagamento === "pix" ||
            dados.formaPagamento === "debito" ||
            (dados.formaPagamento === "credito" && dados.tipoCredito === "parcelado")) && (
            <select
              name="contaBancariaId"
              value={dados.contaBancariaId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Selecione a conta bancária</option>
              {contasBancarias.map((cb) => (
                <option key={cb.id} value={cb.id}>
                  {cb.banco} - Ag. {cb.agencia} / Cc. {cb.conta}
                </option>
              ))}
            </select>
          )}

          {dados.formaPagamento === "credito" && (
            <>
              <select
                name="tipoCredito"
                value={dados.tipoCredito}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="avista">À vista</option>
                <option value="parcelado">Parcelado</option>
              </select>

              {dados.tipoCredito === "parcelado" && (
                <>
                  <input
                    type="number"
                    name="parcelas"
                    value={dados.parcelas}
                    onChange={handleChange}
                    placeholder="Número de parcelas"
                    className="w-full border rounded px-3 py-2"
                    min="1"
                  />
                  <input
                    type="date"
                    name="novaDataVencimento"
                    value={dados.novaDataVencimento}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nova data de vencimento do restante"
                  />
                </>
              )}
            </>
          )}

          <textarea
            name="observacao"
            value={dados.observacao}
            onChange={handleChange}
            placeholder="Observação (opcional)"
            className="w-full border rounded px-3 py-2"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            disabled={disabled}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            disabled={disabled}
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
