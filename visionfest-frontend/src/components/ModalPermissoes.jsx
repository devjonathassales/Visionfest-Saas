import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

const modulosBase = [
  "Contratos",
  "Estoque",
  "Financeiro",
  "Clientes",
  "Contratos",
  "Fornecedores",
  "Agenda",
  "CRM",
  "Relatórios",
  "Configurações",
];

export default function ModalPermissoes({ usuario, onClose, onSave }) {
  const [permissoes, setPermissoes] = useState({});
  const [loadingPermissoes, setLoadingPermissoes] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Ajuste para separar "Usuários" dentro de Configurações
  const modulos = modulosBase.map((modulo) =>
    modulo === "Configurações" ? ["Usuários", "Permissões", "Configurações Gerais"] : modulo
  ).flat();

  // Carregar permissões do usuário do backend
  useEffect(() => {
    if (!usuario) return;
    setLoadingPermissoes(true);
    fetch(`${API_BASE}/permissoes/${usuario.id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Erro ao carregar permissões");
        }
        const data = await res.json();
        setPermissoes(data.permissoes || {});
      })
      .catch((err) => {
        alert(err.message);
        setPermissoes({});
      })
      .finally(() => {
        setLoadingPermissoes(false);
      });
  }, [usuario]);

  // Toggle permissão individual
  const togglePermissao = (modulo, tipo) => {
    setPermissoes((prev) => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [tipo]: !prev[modulo]?.[tipo],
      },
    }));
  };

  // Marcar tudo
  const marcarTudo = () => {
    const todasPermissoes = {};
    modulos.forEach((modulo) => {
      todasPermissoes[modulo] = { visualizar: true, criarEditar: true, excluir: true };
    });
    setPermissoes(todasPermissoes);
  };

  // Desmarcar tudo
  const desmarcarTudo = () => {
    const todasPermissoes = {};
    modulos.forEach((modulo) => {
      todasPermissoes[modulo] = { visualizar: false, criarEditar: false, excluir: false };
    });
    setPermissoes(todasPermissoes);
  };

  // Salvar permissões no backend
  const salvar = async () => {
    setSalvando(true);
    try {
      await onSave(permissoes);
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-open"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-xl"
          aria-label="Fechar modal"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-montserrat">
          Permissões de {usuario.nome}
        </h2>

        {loadingPermissoes ? (
          <p>Carregando permissões...</p>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={marcarTudo}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Marcar Tudo
              </button>
              <button
                type="button"
                onClick={desmarcarTudo}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Desmarcar Tudo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto px-4 py-2 border rounded"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modulos.map((modulo) => (
                <div
                  key={modulo}
                  className="border border-gray-200 rounded-md p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-700 mb-3">{modulo}</h3>

                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={permissoes[modulo]?.visualizar || false}
                      onChange={() => togglePermissao(modulo, "visualizar")}
                    />
                    <span>Visualizar</span>
                  </label>

                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={permissoes[modulo]?.criarEditar || false}
                      onChange={() => togglePermissao(modulo, "criarEditar")}
                    />
                    <span>{modulo === "Estoque" ? "Movimentar" : "Criar / Editar"}</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={permissoes[modulo]?.excluir || false}
                      onChange={() => togglePermissao(modulo, "excluir")}
                    />
                    <span>Excluir</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={salvar}
                disabled={salvando}
                className="bg-[#7ED957] hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md shadow disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar Permissões"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
