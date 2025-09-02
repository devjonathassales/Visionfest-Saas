import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "/src/contexts/authContext.jsx";

import ModalEntradaManual from "/src/components/ModalEntradaManual.jsx";
import ModalSaidaManual from "/src/components/ModalSaidaManual.jsx";

export default function Caixa() {
  const { api } = useAuth();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega contas, totais e lançamentos manuais
  const carregarDados = async () => {
    try {
      const [resPagar, resReceber, resContas, resEntradas, resSaidas] =
        await Promise.all([
          api.get("/api/contas-pagar"),
          api.get("/api/contas-receber"),
          api.get("/api/contas-bancarias"),
          api.get("/api/caixa/entradas"),
          api.get("/api/caixa/saidas"),
        ]);

      const dataPagar = resPagar.data || [];
      const dataReceber = resReceber.data || [];
      const dataContas = resContas.data || [];
      const dataEntradas = resEntradas.data || [];
      const dataSaidas = resSaidas.data || [];

      setContasBancarias(dataContas);

      const pagas = dataPagar.filter((c) => c.status === "pago");
      const recebidas = dataReceber.filter((c) => c.status === "pago");

      const totaisP = {};
      const totaisR = {};
      let totalP = 0;
      let totalR = 0;

      pagas.forEach((c) => {
        const f = c.formaPagamento || "outros";
        const v = Number(c.valorPago) || 0;
        totaisP[f] = (totaisP[f] || 0) + v;
        totalP += v;
      });

      recebidas.forEach((c) => {
        const f = c.formaPagamento || "outros";
        const v = Number(c.valorRecebido) || 0;
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
        dataEntradas.reduce((sum, e) => sum + (Number(e.valor) || 0), 0)
      );
      setTotalSaidas(
        dataSaidas.reduce((sum, s) => sum + (Number(s.valor) || 0), 0)
      );
    } catch (err) {
      console.error("Erro ao carregar dados do caixa:", err);
    }
  };

  // Carrega estado atual do caixa do backend
  const carregarEstadoCaixa = async () => {
    try {
      const res = await api.get("/api/caixa/atual");
      const caixa = res.data || {};
      setCaixaAberto(!!caixa.aberto);
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
      const res = await api.post("/api/caixa/abrir");
      const caixa = res.data;
      setCaixaAberto(!!caixa.aberto);
      setDataAbertura(caixa.dataAbertura ? new Date(caixa.dataAbertura) : null);
      alert("Caixa aberto com sucesso!");
    } catch (error) {
      alert("Erro ao abrir caixa");
      console.error(error);
    }
  };

  // Fechar caixa via API
  const fecharCaixaHandler = async () => {
    try {
      const res = await api.post("/api/caixa/fechar");
      const caixa = res.data;
      setCaixaAberto(!!caixa.aberto);
      setUltimoFechamento(
        caixa.dataFechamento ? new Date(caixa.dataFechamento) : null
      );

      const desejaRetirada = window.confirm(
        "Deseja fazer alguma retirada em dinheiro do caixa?"
      );

      if (desejaRetirada) {
        setMostrarSaidaModal(true);
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
      const res = await api.post("/api/caixa/entrada-manual", entrada);
      const novaEntrada = res.data;
      setEntradasManuais((old) => [...old, novaEntrada]);
      setTotalEntradas((old) => old + (Number(novaEntrada.valor) || 0));
      setMostrarEntradaModal(false);
    } catch (error) {
      alert("Erro ao salvar entrada manual");
      console.error(error);
    }
  };

  // Salvar saída manual via API
  const handleSalvarSaida = async (saida) => {
    try {
      const res = await api.post(
        "/api/caixa/saida-manual",
        saídaNormalizada(saida)
      );
      const novaSaida = res.data;
      setSaidasManuais((old) => [...old, novaSaida]);
      setTotalSaidas((old) => old + (Number(novaSaida.valor) || 0));
      setMostrarSaidaModal(false);
    } catch (error) {
      alert("Erro ao salvar saída manual");
      console.error(error);
    }
  };

  // (Se quiser normalizar algo específico para saida)
  function saídaNormalizada(s) {
    return {
      ...s,
      valor: Number(s.valor) || 0,
    };
  }

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
            <span className="font-semibold">
              R$ {(Number(valor) || 0).toFixed(2)}
            </span>
          </li>
        ))}
        <li className="flex justify-between font-bold text-black pt-2 border-t">
          <span>Total</span>
          <span>R$ {(Number(total) || 0).toFixed(2)}</span>
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
                R$ {(Number(item.valor) || 0).toFixed(2)} ({item.formaPagamento}
                )
              </span>
            </li>
          ))}
          <li className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>R$ {(Number(total) || 0).toFixed(2)}</span>
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
              <td>{(c[tipo] && c[tipo].nome) || "-"}</td>
              <td className="capitalize">{c.formaPagamento}</td>
              <td>R$ {(Number(c[valorField]) || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
