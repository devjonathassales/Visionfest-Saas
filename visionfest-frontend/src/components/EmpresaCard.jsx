import React from "react";

export default function EmpresaCard({
  empresa,
  onVisualizar,
  onEditar,
  onExcluir,
}) {
  return (
    <div className="bg-white shadow rounded p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {empresa.logo ? (
          <img
            src={`/uploads/${empresa.logo}`}
            alt={`${empresa.nome} Logo`}
            className="w-16 h-16 object-contain rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded text-gray-500">
            Sem Logo
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold">{empresa.nome}</h3>
          <p className="text-sm text-gray-600">CNPJ/CPF: {empresa.documento}</p>
          <p className="text-sm text-gray-600">
            Whatsapp: {empresa.whatsapp || "-"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="bg-[#C0C0C0] hover:bg-[#a5a5a5] text-black px-4 py-2 rounded"
          onClick={onVisualizar}
        >
          Visualizar
        </button>
        <button
          className="bg-[#7ED957] hover:bg-[#5cbf3f] text-white px-4 py-2 rounded"
          onClick={onEditar}
        >
          Editar
        </button>
        {/* Excluir não faz sentido no tenant (removido) */}
      </div>
    </div>
  );
}
