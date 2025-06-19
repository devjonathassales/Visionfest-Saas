import React, { useState, useEffect } from 'react';

export default function CentroCustoForm({ onClose, onSalvar, centroSelecionado }) {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('Custo');

  useEffect(() => {
    if (centroSelecionado) {
      setDescricao(centroSelecionado.descricao);
      setTipo(centroSelecionado.tipo);
    }
  }, [centroSelecionado]);

  useEffect(() => {
    const escFunction = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', escFunction);
    return () => document.removeEventListener('keydown', escFunction);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const dados = {
      descricao,
      tipo,
      ...(centroSelecionado?.id && { id: centroSelecionado.id }),
    };

    onSalvar(dados);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-green-600">
          {centroSelecionado ? 'Editar Centro de Custo/Receita' : 'Novo Centro de Custo/Receita'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="Custo">Custo</option>
              <option value="Receita">Receita</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
