import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import NovoPlanoModal from "../../components/Form/NovoPlanoForm";
import { Pencil, Eye, Trash, PlusCircle, Ban } from "lucide-react";

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);

  async function buscarPlanos() {
    try {
      setLoading(true);
      const res = await api.get("/planos");
      setPlanos(res.data);
    } catch (error) {
      alert("Erro ao buscar planos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarPlanos();
  }, []);

  async function excluirPlano(planoId) {
    const confirm = window.confirm("Deseja realmente excluir este plano?");
    if (!confirm) return;

    try {
      await api.delete(`/planos/${planoId}`);
      alert("Plano excluído com sucesso");
      buscarPlanos();
    } catch (error) {
      alert("Erro ao excluir plano. Verifique se ele não está vinculado a nenhuma empresa.");
    }
  }

  return (
    <div className="p-6 pt-20"> {/* padding top para header fixo */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Planos</h1>
        <button
          onClick={() => {
            setPlanoSelecionado(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <PlusCircle size={18} /> Novo Plano
        </button>
      </div>

      {loading ? (
        <p>Carregando planos...</p>
      ) : planos.length === 0 ? (
        <p>Nenhum plano cadastrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Nome</th>
              <th className="border border-gray-300 p-2 text-left">Duração</th>
              <th className="border border-gray-300 p-2 text-left">Valor</th>
              <th className="border border-gray-300 p-2 text-left">Renovação Automática</th>
              <th className="border border-gray-300 p-2 text-left">Atraso/Bloqueio</th>
              <th className="border border-gray-300 p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {planos.map((plano) => (
              <tr key={plano.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{plano.nome}</td>
                <td className="border border-gray-300 p-2">{plano.duracao} meses</td>
                <td className="border border-gray-300 p-2">R$ {plano.valor.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">
                  {plano.renovacaoAutomatica ? "Sim" : "Não"}
                </td>
                <td className="border border-gray-300 p-2">
                  Bloqueia após {plano.diasAtraso} dias / Inativa com {plano.parcelasAbertas} parcelas
                </td>
                <td className="border border-gray-300 p-2 flex gap-2">
                  <button
                    onClick={() => {
                      setPlanoSelecionado(plano);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Inativar"
                  >
                    <Ban size={18} />
                  </button>
                  <button
                    onClick={() => excluirPlano(plano.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <NovoPlanoModal
          plano={planoSelecionado}
          onClose={() => setShowModal(false)}
          onSuccess={buscarPlanos}
        />
      )}
    </div>
  );
}
