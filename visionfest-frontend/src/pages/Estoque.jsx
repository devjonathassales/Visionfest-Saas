import React, { useState, useEffect, useCallback } from "react";
import MovimentarEstoqueForm from "../components/MovimentarEstoqueForm";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { toast } from "react-toastify";

dayjs.locale("pt-br");
const API_BASE_URL = "http://localhost:5000/api";

function getSemanaAtual() {
  const hoje = dayjs();
  const inicio = hoje.startOf("week");
  const fim = hoje.endOf("week");
  return {
    inicio: inicio.format("YYYY-MM-DD"),
    fim: fim.format("YYYY-MM-DD"),
  };
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [visao, setVisao] = useState("semanal");
  const [{ inicio, fim }, setPeriodo] = useState(getSemanaAtual());
  const [mostrarMovimentacao, setMostrarMovimentacao] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMostrarMovimentacao(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const hoje = dayjs();
    let novaDataInicio = hoje;
    let novaDataFim = hoje;

    if (visao === "diario") {
      novaDataInicio = hoje.startOf("day");
      novaDataFim = hoje.endOf("day");
    } else if (visao === "mensal") {
      novaDataInicio = hoje.startOf("month");
      novaDataFim = hoje.endOf("month");
    } else {
      novaDataInicio = hoje.startOf("week");
      novaDataFim = hoje.endOf("week");
    }

    setPeriodo({
      inicio: novaDataInicio.format("YYYY-MM-DD"),
      fim: novaDataFim.format("YYYY-MM-DD"),
    });
  }, [visao]);

  const fetchEstoque = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/estoque?inicio=${inicio}&fim=${fim}`
      );
      if (!res.ok) throw new Error("Erro ao buscar estoque");
      const data = await res.json();
      setProdutos(data);
    } catch (error) {
      toast.error("Erro ao carregar estoque: " + error.message);
    }
  }, [inicio, fim]);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const onSaveMovimentacao = async (movimentacao) => {
    try {
      const res = await fetch(`${API_BASE_URL}/estoque/movimentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimentacao),
      });

      if (!res.ok) throw new Error("Erro ao movimentar estoque");

      toast.success("Movimentação registrada com sucesso!");
      setMostrarMovimentacao(false);
      fetchEstoque();
    } catch (error) {
      toast.error("Erro ao registrar movimentação: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-[#7ed957] text-center">Estoque</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Pesquisar produto..."
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <select
          value={visao}
          onChange={(e) => setVisao(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="diario">Diário</option>
          <option value="semanal">Semanal</option>
          <option value="mensal">Mensal</option>
        </select>

        <input
          type="date"
          value={inicio}
          onChange={(e) =>
            setPeriodo((prev) => ({ ...prev, inicio: e.target.value }))
          }
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={fim}
          onChange={(e) =>
            setPeriodo((prev) => ({ ...prev, fim: e.target.value }))
          }
          className="border rounded px-3 py-2"
        />

        <button
          onClick={() => setMostrarMovimentacao(true)}
          className="bg-[#7ed957] text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Movimentar Estoque
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Produto</th>
              <th className="p-2 text-center">Estoque Atual</th>
              <th className="p-2 text-center">Estoque Mínimo</th>
              <th className="p-2 text-center">Provisionado</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => {
              const estoqueReal = produto.estoque - produto.provisionado;
              const atingiuMinimo = estoqueReal <= produto.estoqueMinimo;

              return (
                <tr key={produto.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{produto.nome}</td>
                  <td className="p-2 text-center">{produto.estoque}</td>
                  <td className="p-2 text-center">{produto.estoqueMinimo}</td>
                  <td className="p-2 text-center">{produto.provisionado}</td>
                  <td
                    className={`p-2 text-center font-semibold ${
                      atingiuMinimo ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {atingiuMinimo ? "⚠ Atingiu o mínimo" : "OK"}
                  </td>
                </tr>
              );
            })}
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarMovimentacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-lg p-4 relative">
            <MovimentarEstoqueForm
              onClose={() => setMostrarMovimentacao(false)}
              onSave={onSaveMovimentacao}
            />
          </div>
        </div>
      )}
    </div>
  );
}
