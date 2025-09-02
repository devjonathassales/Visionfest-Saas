import React, { useEffect, useState } from "react";
import { useAuth } from "/src/contexts/authContext.jsx";
import { toast } from "react-toastify";

// Chaves (keys) padronizadas que vão para o backend; labels são só para exibir
const MODULOS = [
  { key: "contratos", label: "Contratos" },
  { key: "estoque", label: "Estoque" },
  { key: "financeiro", label: "Financeiro" },
  { key: "clientes", label: "Clientes" },
  { key: "fornecedores", label: "Fornecedores" },
  { key: "agenda", label: "Agenda" },
  { key: "crm", label: "CRM" },
  { key: "relatorios", label: "Relatórios" },
  { key: "usuarios", label: "Usuários" },
  { key: "permissoes", label: "Permissões" },
  { key: "configuracoes", label: "Configurações Gerais" },
];

export default function ModalPermissoes({
  usuario,
  permissoesIniciais = null,
  onClose,
  onSave,
}) {
  const { apiCliente } = useAuth();
  const [permissoes, setPermissoes] = useState({});
  const [loadingPermissoes, setLoadingPermissoes] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega permissões locais: usa 'permissoesIniciais' se vierem, senão busca
  useEffect(() => {
    let ativo = true;
    const hydrate = async () => {
      if (!usuario) return;
      setLoadingPermissoes(true);
      try {
        if (permissoesIniciais) {
          if (ativo) setPermissoes(permissoesIniciais);
        } else if (apiCliente) {
          const { data } = await apiCliente.get(`/permissoes/${usuario.id}`);
          if (ativo) setPermissoes(data?.permissoes || {});
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar permissões");
        if (ativo) setPermissoes({});
      } finally {
        if (ativo) setLoadingPermissoes(false);
      }
    };
    hydrate();
    return () => {
      ativo = false;
    };
  }, [usuario, permissoesIniciais, apiCliente]);

  const togglePermissao = (moduloKey, tipo) => {
    setPermissoes((prev) => ({
      ...prev,
      [moduloKey]: {
        visualizar: !!prev[moduloKey]?.visualizar,
        criarEditar: !!prev[moduloKey]?.criarEditar,
        excluir: !!prev[moduloKey]?.excluir,
        [tipo]: !prev[moduloKey]?.[tipo],
      },
    }));
  };

  const marcarTudo = () => {
    const todas = {};
    MODULOS.forEach(({ key }) => {
      todas[key] = { visualizar: true, criarEditar: true, excluir: true };
    });
    setPermissoes(todas);
  };

  const desmarcarTudo = () => {
    const todas = {};
    MODULOS.forEach(({ key }) => {
      todas[key] = { visualizar: false, criarEditar: false, excluir: false };
    });
    setPermissoes(todas);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSave(permissoes);
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
              {MODULOS.map(({ key, label }) => (
                <div
                  key={key}
                  className="border border-gray-200 rounded-md p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-700 mb-3">{label}</h3>

                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={!!permissoes[key]?.visualizar}
                      onChange={() => togglePermissao(key, "visualizar")}
                    />
                    <span>Visualizar</span>
                  </label>

                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={!!permissoes[key]?.criarEditar}
                      onChange={() => togglePermissao(key, "criarEditar")}
                    />
                    <span>
                      {label === "Estoque" ? "Movimentar" : "Criar / Editar"}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="form-checkbox text-[#7ED957]"
                      checked={!!permissoes[key]?.excluir}
                      onChange={() => togglePermissao(key, "excluir")}
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
