import React, { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import api from "../../utils/api";
import { toast } from "react-toastify";

export default function ContasPagarForm({ conta, onClose, onSave, onPagar }) {
  const modalRef = useRef();
  const [dados, setDados] = useState({
    descricao: conta?.descricao || "",
    centroCustoId: conta?.centroCustoId || "",
    fornecedor: conta?.fornecedor || "",
    vencimento: conta?.vencimento || "",
    valor: conta?.valor || "",
    desconto: conta?.desconto || 0,
    tipoDesconto: conta?.tipoDesconto || "valor",
  });
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [salvando, setSalvando] = useState(false);

  // Fechar modal ao clicar fora e com ESC (mesmo código que você já tem)

  useEffect(() => {
    const carregar = async () => {
      try {
        const resCentros = await api.get("/centros-custo");
        setCentrosCusto(resCentros.data);
      } catch {
        toast.error("Erro ao carregar centros de custo.");
      }
    };
    carregar();
  }, []);

  const handleChange = (e) => {
    setDados({ ...dados, [e.target.name]: e.target.value });
  };

  // Função que cria ou atualiza conta
  const salvarConta = async () => {
    if (!dados.descricao || !dados.centroCustoId || !dados.vencimento || !dados.valor) {
      toast.warn("Preencha todos os campos obrigatórios.");
      return null;
    }

    const payload = {
      ...dados,
      valorTotal: parseFloat(dados.valor) - parseFloat(dados.desconto || 0),
    };

    try {
      let res;
      if (conta) {
        res = await api.put(`/contas-pagar/${conta.id}`, payload);
      } else {
        res = await api.post("/contas-pagar", payload);
      }
      return res.data;
    } catch (err) {
      toast.error("Erro ao salvar conta: " + err.message);
      return null;
    }
  };

  // Salvar apenas (status aberto)
  const handleSalvar = async () => {
    setSalvando(true);
    const contaSalva = await salvarConta();
    setSalvando(false);

    if (contaSalva) {
      toast.success("Conta salva com sucesso!");
      onSave();
      onClose();
    }
  };

  // Salvar e pagar (status pago)
  const handleSalvarEPagar = async () => {
    setSalvando(true);
    const contaSalva = await salvarConta();

    if (!contaSalva) {
      setSalvando(false);
      return;
    }

    try {
      // Exemplo de payload básico para pagamento
      const pagamentoPayload = {
        dataPagamento: new Date().toISOString().substring(0, 10), // hoje
        formaPagamento: "pix", // Pode adaptar para o que precisar
        valorPago: contaSalva.valorTotal,
        troco: 0,
      };
      await api.put(`/contas-pagar/${contaSalva.id}/baixa`, pagamentoPayload);

      toast.success("Conta paga com sucesso!");
      onPagar && onPagar(contaSalva);
      onClose();
    } catch (err) {
      toast.error("Erro ao processar pagamento: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
  <div
    ref={modalRef}
    className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto"
  >
    <button
      onClick={onClose}
      className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
    >
      <FiX size={20} />
    </button>

    <h2 className="text-2xl font-bold mb-4 text-green-600">
      {conta ? "Editar Conta" : "Nova Conta"}
    </h2>

        <div className="space-y-4">
          {/* Campos do form com labels (como você já pediu anteriormente) */}
          <label className="block font-semibold">Descrição *</label>
          <input
            type="text"
            name="descricao"
            value={dados.descricao}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />

          <label className="block font-semibold">Centro de Custo *</label>
          <select
            name="centroCustoId"
            value={dados.centroCustoId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Selecione o Centro de Custo</option>
            {centrosCusto.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descricao}
              </option>
            ))}
          </select>

          <label className="block font-semibold">Fornecedor (opcional)</label>
          <input
            type="text"
            name="fornecedor"
            value={dados.fornecedor}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <label className="block font-semibold">Vencimento *</label>
          <input
            type="date"
            name="vencimento"
            value={dados.vencimento}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />

          <label className="block font-semibold">Valor (R$) *</label>
          <input
            type="number"
            name="valor"
            value={dados.valor}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />

          <label className="block font-semibold">Desconto</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="desconto"
              value={dados.desconto}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
            <select
              name="tipoDesconto"
              value={dados.tipoDesconto}
              onChange={handleChange}
              className="w-32 border rounded px-3 py-2"
            >
              <option value="valor">R$</option>
              <option value="percentual">%</option>
            </select>
          </div>
        </div>

         <div className="flex flex-wrap justify-end gap-2 mt-6">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        disabled={salvando}
      >
        Cancelar
      </button>

      <button
        onClick={handleSalvar}
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        disabled={salvando}
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>

      <button
        onClick={handleSalvarEPagar}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        disabled={salvando}
      >
        {salvando ? "Processando..." : "Salvar e Pagar"}
      </button>
    </div>
  </div>
</div>
  );
}