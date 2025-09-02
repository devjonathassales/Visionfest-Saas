import React, { useState, useEffect } from "react";

export default function ContaBancariaForm({ conta, onCancel, onSave }) {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [contaInput, setContaInput] = useState("");
  const [possuiPix, setPossuiPix] = useState(false);
  const [tipoPix, setTipoPix] = useState("");
  const [valorPix, setValorPix] = useState("");

  useEffect(() => {
    if (conta) {
      setBanco(conta.banco || "");
      setAgencia(conta.agencia || "");
      setContaInput(conta.conta || "");
      setPossuiPix(!!conta.chavePix);
      setTipoPix(conta.chavePix?.tipo || "");
      setValorPix(conta.chavePix?.valor || "");
    } else {
      setBanco("");
      setAgencia("");
      setContaInput("");
      setPossuiPix(false);
      setTipoPix("");
      setValorPix("");
    }
  }, [conta]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!banco.trim() || !agencia.trim()) {
      alert("Banco e Agência são obrigatórios.");
      return;
    }
    if (possuiPix && (!tipoPix || !valorPix.trim())) {
      alert("Preencha o tipo e a chave Pix.");
      return;
    }

    onSave({
      id: conta?.id,
      banco: banco.trim(),
      agencia: agencia.trim(),
      conta: contaInput.trim(),
      chavePix: possuiPix ? { tipo: tipoPix, valor: valorPix.trim() } : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-green-600">
        {conta ? "Editar Conta Bancária" : "Nova Conta Bancária"}
      </h2>

      <div>
        <label className="block mb-1 font-semibold">Banco *</label>
        <input
          type="text"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold">Agência *</label>
        <input
          type="text"
          value={agencia}
          onChange={(e) => setAgencia(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold">Conta (opcional)</label>
        <input
          type="text"
          value={contaInput}
          onChange={(e) => setContaInput(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="possuiPix"
          checked={possuiPix}
          onChange={(e) => setPossuiPix(e.target.checked)}
        />
        <label htmlFor="possuiPix" className="select-none">
          Possui chave Pix?
        </label>
      </div>

      {possuiPix && (
        <>
          <div>
            <label className="block mb-1 font-semibold">Tipo de chave *</label>
            <select
              value={tipoPix}
              onChange={(e) => setTipoPix(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              required
            >
              <option value="">Selecione</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="Email">E-mail</option>
              <option value="Telefone">Telefone</option>
              <option value="Aleatória">Aleatória</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Chave Pix *</label>
            <input
              type="text"
              value={valorPix}
              onChange={(e) => setValorPix(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              required
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
