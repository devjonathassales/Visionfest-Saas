import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaBoxOpen,
  FaCashRegister,
  FaShoppingCart,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "/src/contexts/authContext.jsx";
import KpiCard from "/src/components/KpiCard.jsx";

export default function DashboardPage() {
  const { apiCliente } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------- fetch -------
  useEffect(() => {
    let ativo = true;
    (async () => {
      if (!apiCliente) return;
      try {
        setLoading(true);
        const { data } = await apiCliente.get("/dashboard");
        if (ativo) setDados(data);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        if (ativo) setDados(null);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [apiCliente]);

  // ------- helpers -------
  const fmtMoeda = useMemo(
    () => (v) =>
      `R$ ${Number(v || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    []
  );

  // calcula delta do faturamento: último vs anterior
  const { deltaFaturamento, sparkFaturamento, chartData } = useMemo(() => {
    const serie = Array.isArray(dados?.faturamentoUltimos6Meses)
      ? dados.faturamentoUltimos6Meses
      : [];
    const last = serie[serie.length - 1]?.total ?? 0;
    const prev = serie[serie.length - 2]?.total ?? 0;
    const delta = prev > 0 ? ((last - prev) / prev) * 100 : last > 0 ? 100 : 0;
    const spark = serie.map((p) => Number(p.total || 0));
    // garanta chaves para Recharts
    const chart = serie.map((p) => ({
      mes: p.mes,
      total: Number(p.total || 0),
    }));
    return {
      deltaFaturamento: delta,
      sparkFaturamento: spark,
      chartData: chart,
    };
  }, [dados]);

  // ------- KPIs -------
  const cards = useMemo(() => {
    return [
      {
        title: "Clientes",
        value: dados?.totalClientes ?? 0,
        icon: <FaUsers size={18} />,
        delta:
          typeof dados?.deltaClientesMes === "number"
            ? dados.deltaClientesMes
            : null,
        hint: "no mês",
        spark: Array.isArray(dados?.clientesSpark) ? dados.clientesSpark : [],
      },
      {
        title: "Produtos em Estoque",
        value: dados?.totalProdutos ?? 0,
        icon: <FaBoxOpen size={18} />,
        delta:
          typeof dados?.deltaProdutosMes === "number"
            ? dados.deltaProdutosMes
            : null,
        hint: "no mês",
        spark: Array.isArray(dados?.produtosSpark) ? dados.produtosSpark : [],
      },
      {
        title: "Faturamento do Mês",
        value: fmtMoeda(dados?.totalFaturamento),
        icon: <FaCashRegister size={18} />,
        delta: deltaFaturamento,
        hint: "vs mês anterior",
        spark: sparkFaturamento,
      },
      {
        title: "Contratos do Mês",
        value: dados?.totalContratosMes ?? 0,
        icon: <FaShoppingCart size={18} />,
        delta:
          typeof dados?.deltaContratosMes === "number"
            ? dados.deltaContratosMes
            : null,
        hint: "no mês",
        spark: Array.isArray(dados?.contratosSpark) ? dados.contratosSpark : [],
      },
    ];
  }, [dados, deltaFaturamento, sparkFaturamento, fmtMoeda]);

  // ------- skeleton -------
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-7 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white ring-1 ring-zinc-200/70 shadow-sm animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white ring-1 ring-zinc-200/70 shadow-sm animate-pulse" />
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="p-8 text-center text-rose-600">
        Erro ao carregar dados do dashboard.
      </div>
    );
  }

  // ------- UI -------
  return (
    <div className="p-6 md:p-8 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-500">
        Visão Geral
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <KpiCard
            key={i}
            title={c.title}
            value={c.value}
            delta={c.delta}
            hint={c.hint}
            icon={c.icon}
            spark={c.spark}
          />
        ))}
      </div>

      {/* Gráfico */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-zinc-600">
            Faturamento dos Últimos 6 Meses
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                `R$ ${Number(value || 0)
                  .toFixed(2)
                  .replace(".", ",")}`
              }
            />
            <Bar dataKey="total" fill="#7ED957" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
