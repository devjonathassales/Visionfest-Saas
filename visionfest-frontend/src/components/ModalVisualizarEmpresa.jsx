import React from "react";

export default function ModalVisualizarEmpresa({ empresa, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative font-open shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-[#7ED957] font-montserrat mb-4">
          Detalhes da Empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Nome:</strong> {empresa.nome}
          </div>
          <div>
            <strong>Documento:</strong> {empresa.documento}
          </div>
          <div>
            <strong>Email:</strong> {empresa.email || "-"}
          </div>
          <div>
            <strong>Telefone:</strong> {empresa.telefone || "-"}
          </div>
          <div>
            <strong>Whatsapp:</strong> {empresa.whatsapp || "-"}
          </div>
          <div>
            <strong>Instagram:</strong> {empresa.instagram || "-"}
          </div>
          <div className="col-span-2">
            <strong>Logomarca:</strong>{" "}
            {empresa.logo ? (
              <img
                src={`http://localhost:5000/uploads/${empresa.logo}`}
                alt="Logo"
                className="h-24 mt-2 object-contain"
              />
            ) : (
              "Não enviada"
            )}
          </div>
        </div>

        {empresa.enderecos && empresa.enderecos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-[#C0C0C0]">
              Endereço(s)
            </h3>
            <ul className="space-y-2">
              {empresa.enderecos.map((end, i) => (
                <li
                  key={i}
                  className="bg-gray-100 p-3 rounded border border-gray-200"
                >
                  <p>
                    {end.logradouro}, {end.numero} - {end.bairro}
                  </p>
                  <p>
                    {end.cidade} / {end.estado} - CEP: {end.cep}
                  </p>
                  {end.padrao && (
                    <span className="text-green-600 font-semibold">
                      Endereço Padrão
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-[#C0C0C0] hover:bg-[#a5a5a5] text-black px-6 py-2 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
