import React, { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

import ContaReceberForm from "../../components/ContaReceberForm";
import ReceberForm from "../../components/ReceberForm";

export default function ContasReceber() {
  const [contas, setContas] = useState([
    // exemplo de dados iniciais
    {
      id: 1,
      descricao: "Festa de Aniversário",
      centroReceita: "Eventos",
      vencimento: "2025-06-20",
      pagamento: "",
      valor: 1000,
      desconto: 0,
      tipoDesconto: "valor",
      valorTotal: 1000,
      status: "aberto",
      dataPagamento: null,
      infoPagamento: null,
    },
  ]);
  const [filtro, setFiltro] = useState("mensal");
  const [dataInicial, setDataInicial] = useState(startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState(endOfMonth(new Date()));
  const [pesquisa, setPesquisa] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [mostrarReceberForm, setMostrarReceberForm] = useState(false);

  useEffect(() => {
    atualizarPeriodo(filtro);
  }, [filtro]);

  const atualizarPeriodo = (tipo) => {
    const hoje = new Date();
    switch (tipo) {
      case "mensal":
        setDataInicial(startOfMonth(hoje));
        setDataFinal(endOfMonth(hoje));
        break;
      case "semanal":
        setDataInicial(startOfWeek(hoje, { weekStartsOn: 0 }));
        setDataFinal(endOfWeek(hoje, { weekStartsOn: 0 }));
        break;
      case "diario":
        setDataInicial(hoje);
        setDataFinal(hoje);
        break;
      default:
        break;
    }
  };

  const contasFiltradas = contas
    .filter((c) => {
      const venc = new Date(c.vencimento);
      return venc >= dataInicial && venc <= dataFinal;
    })
    .filter((c) =>
      pesquisa === ""
        ? true
        : c.descricao.toLowerCase().includes(pesquisa.toLowerCase())
    )
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

  const abrirReceberForm = (conta) => {
    setContaSelecionada(conta);
    setMostrarReceberForm(true);
  };

  const fecharReceberForm = () => {
    setContaSelecionada(null);
    setMostrarReceberForm(false);
  };

  const handleBaixa = (dadosBaixa) => {
    setContas((prev) =>
      prev.map((c) =>
        c.id === contaSelecionada.id
          ? {
              ...c,
              status: "pago",
              dataPagamento: dadosBaixa.dataRecebimento,
              infoPagamento: dadosBaixa,
            }
          : c
      )
    );
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Pesquisar contas..."
            className="input input-bordered"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
          <select
            className="select select-bordered"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="mensal">Mensal</option>
            <option value="semanal">Semanal</option>
            <option value="diario">Diário</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={format(dataInicial, "yyyy-MM-dd")}
              onChange={(e) => setDataInicial(new Date(e.target.value))}
              className="input input-bordered"
            />
            <input
              type="date"
              value={format(dataFinal, "yyyy-MM-dd")}
              onChange={(e) => setDataFinal(new Date(e.target.value))}
              className="input input-bordered"
            />
          </div>
        </div>

        <button
          onClick={() => setMostrarForm(true)}
          className="btn btn-primary"
        >
          Nova Conta
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Data de Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.map((c) => (
              <tr key={c.id}>
                <td>{c.descricao}</td>
                <td>R$ {parseFloat(c.valorTotal).toFixed(2)}</td>
                <td>{format(new Date(c.vencimento), "dd/MM/yyyy")}</td>
                <td>{c.status}</td>
                <td>
                  {c.status === "pago" && c.dataPagamento
                    ? format(new Date(c.dataPagamento), "dd/MM/yyyy")
                    : "-"}
                </td>
                <td>
                  {c.status === "aberto" && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => abrirReceberForm(c)}
                    >
                      Receber
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {contasFiltradas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-gray-500">
                  Nenhuma conta encontrada no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulário de nova conta */}
      {mostrarForm && (
        <ContaReceberForm
          onClose={() => setMostrarForm(false)}
          setContas={setContas}
        />
      )}

      {/* Formulário de recebimento */}
      {mostrarReceberForm && contaSelecionada && (
        <ReceberForm
          conta={contaSelecionada}
          onClose={fecharReceberForm}
          onBaixa={handleBaixa}
        />
      )}
    </div>
  );
}
