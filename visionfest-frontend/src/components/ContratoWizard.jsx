import React, { useState, useEffect } from "react";
import ContratoForm from "./ContratoForm";
import ContratoFinanceiroForm from "./ContratoFinanceiroForm";

const API_BASE = "http://localhost:5000/api";

export default function ContratoWizard({ onFinalizar, contratoId = null }) {
  const [etapa, setEtapa] = useState("cadastro"); // 'cadastro' | 'financeiro'
  const [contratoCarregado, setContratoCarregado] = useState(null);
  const [modalAberto, setModalAberto] = useState(true);
  const [loading, setLoading] = useState(false);

  const modoEdicao = !!contratoId; // detecta se estamos editando

  // 🔄 Carrega o contrato da API quando contratoId é passado
  useEffect(() => {
    const carregarContrato = async () => {
      if (modoEdicao && contratoId) {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/contratos/${contratoId}`);
          if (!res.ok) throw new Error("Erro ao buscar contrato.");
          const data = await res.json();
          setContratoCarregado(data);
        } catch (err) {
          console.error(err);
          alert("Erro ao carregar contrato.");
          onFinalizar && onFinalizar();
        } finally {
          setLoading(false);
        }
      }
    };

    carregarContrato();
  }, [modoEdicao, contratoId, onFinalizar]);

  const fecharTudo = () => {
    setModalAberto(false);
    setEtapa("cadastro");
    setContratoCarregado(null);
    if (onFinalizar) onFinalizar(); // Atualiza lista de contratos
  };

  const handleContratoSalvo = (contrato) => {
    if (!contrato?.id) {
      alert("Erro: contrato salvo não retornou ID válido");
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
          {/* Etapa Cadastro */}
          {etapa === "cadastro" && (
            <ContratoForm
              contrato={contratoCarregado} // passa dados carregados
              modoEdicao={modoEdicao}
              onClose={fecharTudo}
              onContratoSalvo={handleContratoSalvo}
            />
          )}

          {/* Etapa Financeiro */}
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
