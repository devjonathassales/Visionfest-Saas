import React from 'react';

export default function DataTable({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-silver rounded text-sm">
        <thead className="bg-primary text-white font-montserrat">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="py-2 px-3 text-left">{col}</th>
            ))}
            {actions && <th className="py-2 px-3 text-left">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-3 text-silver">Nenhum dado disponível</td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="border-t border-silver">
                {columns.map((col, i) => (
                  <td key={i} className="py-2 px-3">{row[col.toLowerCase()]}</td>
                ))}
                {actions && (
                  <td className="py-2 px-3">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
