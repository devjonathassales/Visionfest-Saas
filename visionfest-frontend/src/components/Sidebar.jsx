import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiUser, FiBox, FiFileText, FiCalendar, FiBarChart2, FiDollarSign,
  FiSettings, FiChevronDown, FiChevronRight
} from 'react-icons/fi';

const menuStructure = [
  { label: 'Dashboard', icon: <FiHome />, path: '/' },
  {
    label: 'Cadastros', icon: <FiUser />, children: [
      { label: 'Clientes', path: '/cadastros/clientes' },
      { label: 'Fornecedores', path: '/cadastros/fornecedores' },
      { label: 'Funcionários', path: '/cadastros/funcionarios' },
      { label: 'Produtos/Serviços', path: '/cadastros/produtos' },
    ]
  },
  { label: 'Estoque', icon: <FiBox />, path: '/estoque' },
  { label: 'Contratos', icon: <FiFileText />, path: '/contratos' },
  { label: 'Agenda', icon: <FiCalendar />, path: '/agenda' },
  { label: 'CRM', icon: <FiBarChart2 />, path: '/crm' },
  {
    label: 'Financeiro', icon: <FiDollarSign />, children: [
      { label: 'Caixa', path: '/financeiro/caixa' },
      { label: 'Contas a Pagar', path: '/financeiro/pagar' },
      { label: 'Contas a Receber', path: '/financeiro/receber' },
      { label: 'Formas de Pagamento', path: '/financeiro/formas-pagamento' },
      { label: 'Contas Bancárias', path: '/financeiro/contas-bancarias' },
      { label: 'Cartões de Crédito', path: '/financeiro/cartoes' },
      { label: 'Centro de Custo/Receita', path: '/financeiro/centro-custo' },
    ]
  },
  {
    label: 'Relatórios', icon: <FiFileText />, children: [
      { label: 'Clientes', path: '/relatorios/clientes' },
      { label: 'Contratos', path: '/relatorios/contratos' },
      { label: 'Agenda', path: '/relatorios/agenda' },
      { label: 'Fluxo de Caixa', path: '/relatorios/fluxo-caixa' },
      { label: 'Financeiro', path: '/relatorios/financeiro' },
      { label: 'Estoque', path: '/relatorios/estoque' },
    ]
  },
  {
    label: 'Configurações', icon: <FiSettings />, children: [
      { label: 'Empresa', path: '/configuracoes/empresa' },
      { label: 'Usuários', path: '/configuracoes/usuarios' },
      { label: 'Permissões de Usuários', path: '/configuracoes/permissoes' },
      { label: 'Faturas', path: '/configuracoes/faturas' },
      { label: 'Contrato', path: '/configuracoes/contrato' },
      { label: 'Alterar Plano', path: '/configuracoes/plano' },
    ]
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-16 md:top-0 left-0 z-50 h-full w-64 bg-silver text-black p-4 shadow-md
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <nav className="flex flex-col gap-2 font-opensans">
          {menuStructure.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const hasChildren = item.children?.length;

            return (
              <div key={idx}>
                {item.path ? (
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded transition ${isActive ? 'bg-primary text-white font-semibold' : 'hover:bg-primary hover:text-white'}`}
                    onClick={onClose}
                  >
                    <div className="flex items-center gap-2">{item.icon} {item.label}</div>
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-primary hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">{item.icon} {item.label}</div>
                      {openMenus[item.label] ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
                    {openMenus[item.label] && hasChildren && (
                      <div className="pl-6 mt-1 flex flex-col gap-1">
                        {item.children.map((sub, subIdx) => (
                          <Link
                            key={subIdx}
                            to={sub.path}
                            onClick={onClose}
                            className={`text-sm px-3 py-1 rounded hover:bg-primary hover:text-white transition ${location.pathname === sub.path ? 'bg-primary text-white' : ''}`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
