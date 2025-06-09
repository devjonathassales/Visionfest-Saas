import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function PageHeader({ title, subtitle, breadcrumbs = [] }) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="text-sm text-gray-500 font-opensans flex items-center gap-1 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <FiChevronRight size={14} />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:underline text-gray-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-800 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Título principal */}
      <h2 className="text-2xl font-montserrat text-primary">{title}</h2>
      
      {/* Subtítulo opcional */}
      {subtitle && (
        <p className="text-sm text-gray-600 font-opensans mt-1">{subtitle}</p>
      )}
    </div>
  );
}
