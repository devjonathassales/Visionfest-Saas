import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaBoxOpen,
  FaCashRegister,
  FaShoppingCart,
  FaChartBar,
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

const API_BASE_URL = "http://localhost:5000/api";

export default function DashboardPage() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard`);
        if (!res.ok) throw new Error("Erro ao carregar dashboard");
        const data = await res.json();
        setDados(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-[#7ED957] font-montserrat">
          Carregando dados do Dashboard...
        </h1>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="p-8 text-center text-red-600">
        Erro ao carregar dados do dashboard.
      </div>
    );
  }

  const cards = [
    {
      title: "Clientes",
      value: dados.totalClientes,
      icon: <FaUsers size={32} className="text-white" />,
      bg: "bg-green-500",
    },
    {
      title: "Produtos em Estoque",
      value: dados.totalProdutos,
      icon: <FaBoxOpen size={32} className="text-white" />,
      bg: "bg-gray-400",
    },
    {
      title: "Faturamento do Mês",
      value: `R$ ${Number(dados.totalFaturamento).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: <FaCashRegister size={32} className="text-white" />,
      bg: "bg-green-600",
    },
    {
      title: "Contratos do Mês",
      value: dados.totalContratosMes,
      icon: <FaShoppingCart size={32} className="text-white" />,
      bg: "bg-gray-500",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-[#7ED957] font-montserrat">
        Visão Geral
      </h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`rounded-lg shadow-lg p-5 text-white ${card.bg} flex items-center justify-between`}
          >
            <div>
              <h2 className="text-xl font-semibold font-montserrat">
                {card.title}
              </h2>
              <p className="text-2xl font-bold mt-2 font-open">{card.value}</p>
            </div>
            <div>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Gráfico faturamento últimos 6 meses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl text-[#C0C0C0] font-semibold mb-4 font-montserrat">
          Faturamento dos Últimos 6 Meses
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados.faturamentoUltimos6Meses}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
            <Bar dataKey="total" fill="#7ED957" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
