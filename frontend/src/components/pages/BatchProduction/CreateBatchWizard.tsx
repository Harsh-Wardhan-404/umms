import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormulationSelector from './wizard/FormulationSelector';
import WorkerShiftSelector from './wizard/WorkerShiftSelector';
import BatchReviewConfirm from './wizard/BatchReviewConfirm';

export interface BatchFormData {
  // Step 1
  formulationId: string;
  formulationVersionId: string;
  productName: string;
  batchSize: number;
  versionNumber: number;
  ingredients: Array<{
    materialId: string;
    materialName: string;
    percentageOrComposition: number;
    unit: string;
    quantityRequired: number;
    availableStock: number;
  }>;
  
  // Step 2
  workers: string[];
  shift: 'Morning' | 'Evening' | 'Night';
  startTime: string;
  productionNotes: string;
}

const steps = [
  { number: 1, title: 'Select Formulation', description: 'Choose product and batch size' },
  { number: 2, title: 'Workers & Shift', description: 'Assign team and schedule' },
  { number: 3, title: 'Review & Confirm', description: 'Verify and create batch' },
];

const CreateBatchWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<BatchFormData>>({});

  const updateFormData = (data: Partial<BatchFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/production/batch-production');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Batch</h1>
          <p className="text-sm text-gray-500">
            Follow the steps to create a production batch
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : currentStep === step.number
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {currentStep > step.number ? <Check size={20} /> : step.number}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto w-full">
        {currentStep === 1 && (
          <FormulationSelector
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <WorkerShiftSelector
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <BatchReviewConfirm
            formData={formData as BatchFormData}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default CreateBatchWizard;

