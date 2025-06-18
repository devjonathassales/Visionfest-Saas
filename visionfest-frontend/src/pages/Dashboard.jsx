import React from "react";
import {
  FaUsers,
  FaBoxOpen,
  FaCashRegister,
  FaShoppingCart,
  FaChartBar,
} from "react-icons/fa";

export default function DashboardPage() {
  const cards = [
    {
      title: "Clientes",
      value: "127",
      icon: <FaUsers size={32} className="text-white" />,
      bg: "bg-green-500",
    },
    {
      title: "Produtos em Estoque",
      value: "238",
      icon: <FaBoxOpen size={32} className="text-white" />,
      bg: "bg-gray-400",
    },
    {
      title: "Vendas do Mês",
      value: "R$ 8.420,00",
      icon: <FaCashRegister size={32} className="text-white" />,
      bg: "bg-green-600",
    },
    {
      title: "Pedidos Abertos",
      value: "16",
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
              <h2 className="text-xl font-semibold font-montserrat">{card.title}</h2>
              <p className="text-2xl font-bold mt-2 font-open">{card.value}</p>
            </div>
            <div>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de exemplo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl text-[#C0C0C0] font-semibold mb-4 font-montserrat">
          Faturamento dos Últimos 6 Meses
        </h2>
        <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
          {/* Aqui entraria um gráfico real, como o Chart.js ou ApexCharts */}
          <FaChartBar size={64} />
          <span className="ml-4 text-lg font-open">Gráfico em desenvolvimento</span>
        </div>
      </div>
    </div>
  );
}
