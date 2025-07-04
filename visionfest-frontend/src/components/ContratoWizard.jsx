import React, { useState, useEffect } from "react";
import ContratoForm from "./ContratoForm";
import ContratoFinanceiroForm from "./ContratoFinanceiroForm";

export default function ContratoWizard({
  onFinalizar,
  contratoExistente = null,
}) {
  const [etapa, setEtapa] = useState("cadastro"); // 'cadastro' | 'financeiro'
  const [contratoSalvo, setContratoSalvo] = useState(null);
  const [modalAberto, setModalAberto] = useState(true);

  // Quando for edição, pula direto para etapa financeira
  useEffect(() => {
    if (contratoExistente) {
      setContratoSalvo(contratoExistente);
      setEtapa("financeiro");
    }
  }, [contratoExistente]);

  const fecharTudo = () => {
    setModalAberto(false);
    setEtapa("cadastro");
    setContratoSalvo(null);
    if (onFinalizar) onFinalizar(); // atualiza lista
  };

  const handleContratoSalvo = (contrato) => {
    if (!contrato?.id) {
      alert("Erro: contrato salvo não retornou ID válido");
      return;
    }
    setContratoSalvo(contrato);
    setEtapa("financeiro");
  };

  const handleFinanceiroSalvo = () => {
    alert("Contrato e financeiro salvos com sucesso!");
    fecharTudo();
  };

  return (
    <>
      {modalAberto && etapa === "cadastro" && (
        <ContratoForm
          contrato={contratoExistente} // para preencher campos se estiver editando
          onClose={fecharTudo}
          onContratoSalvo={handleContratoSalvo}
        />
      )}

      {modalAberto && etapa === "financeiro" && contratoSalvo && (
        <ContratoFinanceiroForm
          contrato={contratoSalvo}
          onClose={fecharTudo}
          onSalvar={handleFinanceiroSalvo}
        />
      )}
    </>
  );
}
