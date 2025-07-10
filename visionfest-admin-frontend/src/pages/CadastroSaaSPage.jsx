import React from "react";
import CadastroWizard from "../components/CadastroWizard/CadastroWizard";

export default function CadastroSaaSPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <CadastroWizard />
      </div>
    </div>
  );
}
