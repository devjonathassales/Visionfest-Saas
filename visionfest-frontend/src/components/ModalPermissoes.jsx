import React from "react";

export default function ModalPermissoes({ usuario, onClose, onSave }) {
  if (!usuario) return null;

  const permissoes = [
    "Contratos",
    "Estoque",
    "Financeiro",
    "Clientes",
    "Vendas/PDV",
    "Configurações",
    "Dashboard",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-open">
      <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl relative overflow-y-auto max-h-[90vh]">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-xl"
        >
          ✕
        </button>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-montserrat">
          Permissões de {usuario.nome}
        </h2>

        {/* Permissões por módulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {permissoes.map((modulo) => (
            <div key={modulo} className="border border-gray-200 rounded-md p-4 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-2">{modulo}</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-[#7ED957]"
                    defaultChecked
                  />
                  <span>Visualizar</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-[#7ED957]"
                  />
                  <span>Criar / Editar</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-[#7ED957]"
                  />
                  <span>Excluir</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Botão de salvar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="bg-[#7ED957] hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md shadow"
          >
            Salvar Permissões
          </button>
        </div>
      </div>
    </div>
  );
}
