import React from 'react';

export interface Step {
  id: string;
  name: string;
  completed?: boolean;
  current?: boolean;
}

interface ProgressProps {
  steps: Step[];
  currentStep: string;
}

export const Progress: React.FC<ProgressProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="border border-gray-300 rounded-md divide-y divide-gray-300 md:flex md:divide-y-0">
        {steps.map((step, stepIdx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > stepIdx;
          
          return (
            <li key={step.id} className="relative md:flex-1 md:flex">
              <div className="group flex items-center w-full">
                <span className="px-6 py-4 flex items-center text-sm font-medium">
                  <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 rounded-full ${
                    isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent 
                        ? 'border-blue-600 text-blue-600'
                        : 'border-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{stepIdx + 1}</span>
                    )}
                  </span>
                  <span className={`ml-4 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </span>
              </div>
              
              {stepIdx !== steps.length - 1 && (
                <div className="hidden md:block absolute top-0 right-0 h-full w-5" aria-hidden="true">
                  <svg
                    className="h-full w-full text-gray-300"
                    viewBox="0 0 22 80"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="m0 40 22 40 0-80z"
                      stroke="currentColor"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
