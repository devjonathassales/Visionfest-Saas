import React, { useState } from "react";
import ModalPermissoes from "../../components/ModalPermissoes";

export default function PermissoesPage() {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const usuarios = [
    { id: 1, nome: "João Silva", email: "joao@email.com" },
    { id: 2, nome: "Maria Souza", email: "maria@email.com" },
  ];

  return (
    <div className="p-8">
      {/* Lista de usuários */}
      {usuarios.map((usuario) => (
        <div key={usuario.id} className="mb-4 flex justify-between items-center bg-white p-4 rounded shadow">
          <div>
            <h3 className="font-semibold">{usuario.nome}</h3>
            <p className="text-gray-600 text-sm">{usuario.email}</p>
          </div>
          <button
            onClick={() => setUsuarioSelecionado(usuario)}
            className="bg-[#7ED957] text-white px-4 py-2 rounded hover:bg-green-600 font-semibold"
          >
            Editar Permissões
          </button>
        </div>
      ))}

      {/* Modal */}
      <ModalPermissoes
        usuario={usuarioSelecionado}
        onClose={() => setUsuarioSelecionado(null)}
        onSave={() => alert("Permissões salvas com sucesso!")}
      />
    </div>
  );
}
