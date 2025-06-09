import React from 'react';

export default function PrimaryButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="bg-primary hover:bg-green-600 text-white font-montserrat py-2 px-4 rounded shadow transition duration-200"
    >
      {children}
    </button>
  );
}
