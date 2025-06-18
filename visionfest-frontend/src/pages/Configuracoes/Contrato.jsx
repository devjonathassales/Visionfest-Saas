import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function ContratoPage() {
  const [modalRenovar, setModalRenovar] = useState(false);
  const [modalMudarPlano, setModalMudarPlano] = useState(false);

  const planoAtual = {
    nome: "Plano Profissional",
    funcionalidades: [
      "Cadastro ilimitado de clientes",
      "Controle financeiro completo",
      "Gestão de estoque com alertas",
      "Relatórios e dashboards",
    ],
    dataInicio: "01/01/2025",
    dataValidade: "01/01/2026",
    status: "Ativo",
  };

  const statusCor = {
    Ativo: "text-green-600",
    Vencido: "text-red-600",
    "Prestes a Vencer": "text-yellow-600",
  };

  const planosDisponiveis = [
    "Plano Profissional",
    "Plano Empresarial",
    "Plano Master"
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold text-[#7ED957] font-montserrat">
        Meu Contrato
      </h1>

      {/* CONTEÚDO DO PLANO */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 font-montserrat">
            {planoAtual.nome}
          </h2>
          <span
            className={`font-semibold text-lg ${statusCor[planoAtual.status]}`}
          >
            {planoAtual.status}
          </span>
        </div>

        <p className="text-gray-700 font-open">
          <strong>Início:</strong> {planoAtual.dataInicio}
        </p>
        <p className="text-gray-700 font-open">
          <strong>Validade:</strong> {planoAtual.dataValidade}
        </p>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 font-montserrat mb-2">
            Funcionalidades do plano:
          </h3>
          <ul className="list-disc ml-5 text-gray-700 font-open">
            {planoAtual.funcionalidades.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setModalRenovar(true)}
            className="bg-[#7ED957] text-white px-6 py-2 rounded-lg shadow hover:bg-green-600 font-semibold font-open"
          >
            Renovar Contrato
          </button>
          <button
            onClick={() => setModalMudarPlano(true)}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg shadow hover:bg-gray-400 font-semibold font-open"
          >
            Mudar de Plano
          </button>
        </div>
      </div>

      {/* MODAL: RENOVAÇÃO */}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setModalRenovar(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-montserrat">
              Renovar Plano
            </h2>
            <p className="text-gray-700 mb-4 font-open">
              Ao renovar, você estenderá sua assinatura atual por mais 12 meses. O novo período começa após o término da validade atual.
            </p>
            <p className="text-sm text-gray-500 italic font-open">
              O cancelamento só pode ser feito com 30 dias de antecedência da data de vencimento.
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  alert("Plano renovado com sucesso!");
                  setModalRenovar(false);
                }}
                className="bg-[#7ED957] text-white px-5 py-2 rounded-md hover:bg-green-600 font-open"
              >
                Confirmar Renovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MUDAR PLANO */}
      {modalMudarPlano && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => setModalMudarPlano(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 font-montserrat">
              Alterar Plano
            </h2>
            <p className="text-gray-700 mb-4 font-open">
              Você pode mudar de plano para uma versão superior a qualquer momento. Não é permitido retroceder para planos inferiores.
            </p>
            <div className="space-y-3 font-open">
              {planosDisponiveis.map((plano, i) =>
                plano !== planoAtual.nome ? (
                  <div key={i}>
                    <input
                      type="radio"
                      name="novoPlano"
                      id={plano}
                      className="mr-2"
                    />
                    <label htmlFor={plano}>{plano}</label>
                  </div>
                ) : null
              )}
            </div>
            <p className="text-sm text-gray-500 italic mt-4 font-open">
              Alterações entrarão em vigor imediatamente após confirmação.
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  alert("Plano alterado com sucesso!");
                  setModalMudarPlano(false);
                }}
                className="bg-[#7ED957] text-white px-5 py-2 rounded-md hover:bg-green-600 font-open"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
