import React, { useState, useEffect } from "react";
import ContratoForm from "./ContratoForm";
import ContratoFinanceiroForm from "./ContratoFinanceiroForm";
import { useAuth } from "../contexts/authContext.jsx";

export default function ContratoWizard({ onFinalizar, contratoId = null }) {
  const { apiCliente } = useAuth();

  const [etapa, setEtapa] = useState("cadastro"); // 'cadastro' | 'financeiro'
  const [contratoCarregado, setContratoCarregado] = useState(null);
  const [modalAberto, setModalAberto] = useState(true);
  const [loading, setLoading] = useState(false);

  const modoEdicao = !!contratoId;

  useEffect(() => {
    const carregarContrato = async () => {
      if (modoEdicao && contratoId) {
        setLoading(true);
        try {
          const { data } = await apiCliente.get(`/contratos/${contratoId}`);
          setContratoCarregado(data);
          setEtapa("cadastro");
        } catch (err) {
          console.error("Erro ao carregar contrato:", err);
          alert("Não foi possível carregar o contrato para edição.");
          fecharTudo();
        } finally {
          setLoading(false);
        }
      }
    };
    carregarContrato();
  }, [apiCliente, modoEdicao, contratoId]);

  const fecharTudo = () => {
    setModalAberto(false);
    setEtapa("cadastro");
    setContratoCarregado(null);
    onFinalizar && onFinalizar();
  };

  const handleContratoSalvo = (contrato) => {
    if (!contrato?.id) {
      alert("Erro: contrato salvo não retornou ID válido.");
      return;
    }
    setContratoCarregado(contrato);
    setEtapa("financeiro");
  };

  const handleFinanceiroSalvo = () => {
    alert(
      modoEdicao
        ? "Contrato atualizado com sucesso!"
        : "Contrato e financeiro salvos com sucesso!"
    );
    fecharTudo();
  };

  if (!modalAberto) return null;

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 text-white text-lg">
          Carregando contrato...
        </div>
      ) : (
        <>
          {etapa === "cadastro" && (
            <ContratoForm
              contrato={contratoCarregado}
              modoEdicao={modoEdicao}
              onClose={fecharTudo}
              onContratoSalvo={handleContratoSalvo}
            />
          )}

          {etapa === "financeiro" && contratoCarregado && (
            <ContratoFinanceiroForm
              contrato={contratoCarregado}
              modoEdicao={modoEdicao}
              onClose={fecharTudo}
              onSalvar={handleFinanceiroSalvo}
            />
          )}
        </>
      )}
    </>
  );
}
