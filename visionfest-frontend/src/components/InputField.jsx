import React from 'react';

export default function InputField({ label, id, type = "text", value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-montserrat text-black mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-silver rounded px-3 py-2 text-sm font-opensans focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
