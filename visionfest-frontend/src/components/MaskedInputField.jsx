import React from "react";
import { IMaskInput } from "react-imask";

export default function MaskedInputField({
  label,
  id,
  name,
  mask,
  value,
  onChange,
  onBlur,
  placeholder = "",
  required = false,
  disabled = false,
  error = null,
}) {
  function handleAccept(value) {
    if (onChange) {
      onChange({
        target: {
          name: name || id,
          value,
        },
      });
    }
  }

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-montserrat text-black mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <IMaskInput
        mask={mask}
        id={id}
        name={name || id}
        value={value}
        onAccept={handleAccept}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full border rounded px-3 py-2 text-sm font-opensans focus:outline-none focus:ring-2 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-silver focus:ring-primary"
        }`}
      />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
