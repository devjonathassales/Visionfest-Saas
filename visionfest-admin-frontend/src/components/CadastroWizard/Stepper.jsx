import React from "react";

export default function Stepper({ currentStep, totalSteps }) {
  return (
    <div className="flex justify-center mb-6 space-x-4">
      {[...Array(totalSteps)].map((_, i) => {
        const stepNum = i + 1;
        const active = stepNum === currentStep;
        const completed = stepNum < currentStep;
        return (
          <div
            key={stepNum}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${
              completed
                ? "bg-green-600"
                : active
                ? "bg-blue-600"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {stepNum}
          </div>
        );
      })}
    </div>
  );
}
