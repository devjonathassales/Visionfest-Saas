import React, { useState, useEffect } from "react";
import ContratoForm from "./ContratoForm";
import ContratoFinanceiroForm from "./ContratoFinanceiroForm";

const API_BASE = "http://localhost:5000/api";

export default function ContratoWizard({ onFinalizar, contratoId = null }) {
  const [etapa, setEtapa] = useState("cadastro"); // 'cadastro' | 'financeiro'
  const [contratoCarregado, setContratoCarregado] = useState(null);
  const [modalAberto, setModalAberto] = useState(true);
  const [loading, setLoading] = useState(false);

  const modoEdicao = !!contratoId;

  // 🔄 Carrega contrato da API quando contratoId é passado
  useEffect(() => {
    const carregarContrato = async () => {
      if (modoEdicao && contratoId) {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE}/contratos/${contratoId}`);
          if (!response.ok) throw new Error("Erro ao buscar contrato.");
          const data = await response.json();
          setContratoCarregado(data);
          setEtapa("cadastro"); // começa pelo cadastro para permitir ajustes
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoEdicao, contratoId]);

  const fecharTudo = () => {
    setModalAberto(false);
    setEtapa("cadastro");
    setContratoCarregado(null);
    if (onFinalizar) onFinalizar(); // Atualiza lista
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
