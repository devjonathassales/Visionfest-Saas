import React, { useEffect, useState } from "react";
import { format } from "date-fns";

import ModalEntradaManual from "../../components/ModalEntradaManual";
import ModalSaidaManual from "../../components/ModalSaidaManual";

const API_BASE = "http://localhost:5000/api";

export default function Caixa() {
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [entradasManuais, setEntradasManuais] = useState([]);
  const [saidasManuais, setSaidasManuais] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);

  const [totaisPagas, setTotaisPagas] = useState({});
  const [totaisRecebidas, setTotaisRecebidas] = useState({});
  const [totalGeralPago, setTotalGeralPago] = useState(0);
  const [totalGeralRecebido, setTotalGeralRecebido] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);

  const [caixaAberto, setCaixaAberto] = useState(false);
  const [dataAbertura, setDataAbertura] = useState(null);
  const [ultimoFechamento, setUltimoFechamento] = useState(null);

  const [mostrarEntradaModal, setMostrarEntradaModal] = useState(false);
  const [mostrarSaidaModal, setMostrarSaidaModal] = useState(false);

  useEffect(() => {
    carregarDados();
    carregarEstadoCaixa();
  }, []);

  // Carrega contas, totais e lançamentos manuais
  const carregarDados = async () => {
    try {
      const [resPagar, resReceber, resContas, resEntradas, resSaidas] =
        await Promise.all([
          fetch(`${API_BASE}/contas-pagar`),
          fetch(`${API_BASE}/contas-receber`),
          fetch(`${API_BASE}/contas-bancarias`),
          fetch(`${API_BASE}/caixa/entradas`),
          fetch(`${API_BASE}/caixa/saidas`),
        ]);

      const dataPagar = await resPagar.json();
      const dataReceber = await resReceber.json();
      const dataContas = await resContas.json();
      const dataEntradas = await resEntradas.json();
      const dataSaidas = await resSaidas.json();

      setContasBancarias(dataContas);

      const pagas = dataPagar.filter((c) => c.status === "pago");
      const recebidas = dataReceber.filter((c) => c.status === "pago");

      const totaisP = {};
      const totaisR = {};
      let totalP = 0;
      let totalR = 0;

      pagas.forEach((c) => {
        const f = c.formaPagamento || "outros";
        const v = parseFloat(c.valorPago || 0);
        totaisP[f] = (totaisP[f] || 0) + v;
        totalP += v;
      });

      recebidas.forEach((c) => {
        const f = c.formaPagamento || "outros";
        const v = parseFloat(c.valorRecebido || 0);
        totaisR[f] = (totaisR[f] || 0) + v;
        totalR += v;
      });

      setContasPagar(pagas);
      setContasReceber(recebidas);
      setTotaisPagas(totaisP);
      setTotaisRecebidas(totaisR);
      setTotalGeralPago(totalP);
      setTotalGeralRecebido(totalR);

      setEntradasManuais(dataEntradas);
      setSaidasManuais(dataSaidas);
      setTotalEntradas(
        dataEntradas.reduce((sum, e) => sum + parseFloat(e.valor), 0)
      );
      setTotalSaidas(
        dataSaidas.reduce((sum, s) => sum + parseFloat(s.valor), 0)
      );
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  // Carrega estado atual do caixa do backend
  const carregarEstadoCaixa = async () => {
    try {
      const res = await fetch(`${API_BASE}/caixa/atual`);
      if (!res.ok)
        throw new Error("Não foi possível carregar o estado do caixa");
      const caixa = await res.json();

      setCaixaAberto(caixa.aberto);
      setDataAbertura(caixa.dataAbertura ? new Date(caixa.dataAbertura) : null);
      setUltimoFechamento(
        caixa.dataFechamento ? new Date(caixa.dataFechamento) : null
      );
    } catch (error) {
      console.error("Erro ao carregar estado do caixa:", error);
    }
  };

  // Abrir caixa via API
  const abrirCaixaHandler = async () => {
    try {
      const res = await fetch(`${API_BASE}/caixa/abrir`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao abrir caixa");
      const caixa = await res.json();
      setCaixaAberto(caixa.aberto);
      setDataAbertura(new Date(caixa.dataAbertura));
      alert("Caixa aberto com sucesso!");
    } catch (error) {
      alert("Erro ao abrir caixa");
      console.error(error);
    }
  };

  // Fechar caixa via API
  const fecharCaixaHandler = async () => {
    try {
      const res = await fetch(`${API_BASE}/caixa/fechar`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao fechar caixa");
      const caixa = await res.json();
      setCaixaAberto(caixa.aberto);
      setUltimoFechamento(new Date(caixa.dataFechamento));

      // Pergunta se deseja fazer retirada de dinheiro
      const desejaRetirada = window.confirm(
        "Deseja fazer alguma retirada em dinheiro do caixa?"
      );

      if (desejaRetirada) {
        setMostrarSaidaModal(true); // abrir modal de saída manual
      } else {
        alert("Caixa fechado com sucesso!");
      }
    } catch (error) {
      alert("Erro ao fechar caixa");
      console.error(error);
    }
  };

  // Salvar entrada manual via API
  const handleSalvarEntrada = async (entrada) => {
    try {
      const res = await fetch(`${API_BASE}/caixa/entrada-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entrada),
      });
      if (!res.ok) throw new Error("Erro ao salvar entrada manual");
      const novaEntrada = await res.json();
      setEntradasManuais((old) => [...old, novaEntrada]);
      setTotalEntradas((old) => old + parseFloat(novaEntrada.valor));
      setMostrarEntradaModal(false);
    } catch (error) {
      alert("Erro ao salvar entrada manual");
      console.error(error);
    }
  };

  // Salvar saída manual via API
  const handleSalvarSaida = async (saida) => {
    try {
      const res = await fetch(`${API_BASE}/caixa/saida-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saida),
      });
      if (!res.ok) throw new Error("Erro ao salvar saída manual");
      const novaSaida = await res.json();
      setSaidasManuais((old) => [...old, novaSaida]);
      setTotalSaidas((old) => old + parseFloat(novaSaida.valor));
      setMostrarSaidaModal(false);
    } catch (error) {
      alert("Erro ao salvar saída manual");
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold text-[#7ED957] text-center">Caixa</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>Caixa aberto em:</strong>{" "}
            {dataAbertura ? format(dataAbertura, "dd/MM/yyyy HH:mm") : "-"}
          </div>
          <div>
            <strong>Último fechamento:</strong>{" "}
            {ultimoFechamento
              ? format(ultimoFechamento, "dd/MM/yyyy HH:mm")
              : "-"}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="bg-[#7ED957] text-white font-bold px-4 py-2 rounded"
            onClick={abrirCaixaHandler}
            disabled={caixaAberto}
          >
            Abrir Caixa
          </button>
          <button
            className="bg-red-500 text-white font-bold px-4 py-2 rounded"
            onClick={fecharCaixaHandler}
            disabled={!caixaAberto}
          >
            Fechar Caixa
          </button>
          <button
            className="bg-blue-500 text-white font-bold px-4 py-2 rounded"
            onClick={() => setMostrarEntradaModal(true)}
            disabled={!caixaAberto}
          >
            Entrada Manual
          </button>
          <button
            className="bg-yellow-500 text-white font-bold px-4 py-2 rounded"
            onClick={() => setMostrarSaidaModal(true)}
            disabled={!caixaAberto}
          >
            Saída Manual
          </button>
        </div>
      </div>

      {/* Totais */}
      <div className="grid md:grid-cols-2 gap-6">
        <Totais
          title="Totais Pagos"
          dados={totaisPagas}
          total={totalGeralPago}
        />
        <Totais
          title="Totais Recebidos"
          dados={totaisRecebidas}
          total={totalGeralRecebido}
        />
      </div>

      {/* Contas Pagas e Recebidas */}
      <div className="grid md:grid-cols-2 gap-6">
        <TabelaContas
          title="Contas Pagas"
          contas={contasPagar}
          tipo="fornecedor"
          valorField="valorPago"
        />
        <TabelaContas
          title="Contas Recebidas"
          contas={contasReceber}
          tipo="cliente"
          valorField="valorRecebido"
        />
      </div>

      {/* Entradas e saídas manuais */}
      <div className="grid md:grid-cols-2 gap-6">
        <ListaLancamentos
          title="Entradas Manuais"
          lista={entradasManuais}
          total={totalEntradas}
        />
        <ListaLancamentos
          title="Saídas Manuais"
          lista={saidasManuais}
          total={totalSaidas}
        />
      </div>

      {/* Modais */}
      <ModalEntradaManual
        isOpen={mostrarEntradaModal}
        onClose={() => setMostrarEntradaModal(false)}
        contasBancarias={contasBancarias}
        onSalvar={handleSalvarEntrada}
      />
      <ModalSaidaManual
        isOpen={mostrarSaidaModal}
        onClose={() => setMostrarSaidaModal(false)}
        contasBancarias={contasBancarias}
        onSalvar={handleSalvarSaida}
      />
    </div>
  );
}

// Componentes auxiliares

function Totais({ title, dados, total }) {
  return (
    <div className="bg-white border rounded-lg shadow p-4">
      <h2 className="text-xl font-bold text-[#7ED957] mb-4">{title}</h2>
      <ul className="space-y-2">
        {Object.entries(dados).map(([forma, valor]) => (
          <li
            key={forma}
            className="flex justify-between text-sm border-b py-1"
          >
            <span className="capitalize">{forma}</span>
            <span className="font-semibold">R$ {valor.toFixed(2)}</span>
          </li>
        ))}
        <li className="flex justify-between font-bold text-black pt-2 border-t">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </li>
      </ul>
    </div>
  );
}

function ListaLancamentos({ title, lista, total }) {
  return (
    <div className="bg-white border rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold text-[#7ED957] mb-2">{title}</h2>
      {lista.length === 0 ? (
        <p className="text-gray-500">Nenhum lançamento registrado.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((item) => (
            <li
              key={item.id}
              className="flex justify-between text-sm border-b py-1"
            >
              <span>{item.descricao}</span>
              <span>
                R$ {parseFloat(item.valor).toFixed(2)} ({item.formaPagamento})
              </span>
            </li>
          ))}
          <li className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </li>
        </ul>
      )}
    </div>
  );
}

function TabelaContas({ title, contas, tipo, valorField }) {
  return (
    <div className="bg-white border rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-xl font-semibold text-[#7ED957] mb-2">{title}</h2>
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="text-left text-gray-600 border-b">
            <th>Descrição</th>
            <th>{tipo === "fornecedor" ? "Fornecedor" : "Cliente"}</th>
            <th>Forma</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((c) => (
            <tr key={c.id} className="border-t">
              <td>{c.descricao}</td>
              <td>{c[tipo]?.nome || "-"}</td>
              <td className="capitalize">{c.formaPagamento}</td>
              <td>R$ {parseFloat(c[valorField]).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
