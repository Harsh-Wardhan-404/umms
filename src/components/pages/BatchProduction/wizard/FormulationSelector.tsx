import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { BatchFormData } from '../CreateBatchWizard';

interface FormulationSelectorProps {
  formData: Partial<BatchFormData>;
  updateFormData: (data: Partial<BatchFormData>) => void;
  onNext: () => void;
}

interface Formulation {
  id: string;
  productName: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    isLocked: boolean;
    ingredients: Array<{
      materialId: string;
      percentageOrComposition: number;
      unit: string;
      material: {
        id: string;
        name: string;
        type: string;
        currentStockQty: number;
        unit: string;
      };
    }>;
  }>;
}

const FormulationSelector = ({ formData, updateFormData, onNext }: FormulationSelectorProps) => {
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormulation, setSelectedFormulation] = useState<Formulation | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(formData.versionNumber || null);
  const [batchSize, setBatchSize] = useState<number>(formData.batchSize || 0);
  const [requirements, setRequirements] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFormulations();
  }, []);

  const fetchFormulations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/formulations', {
        params: { locked: true } // Only show formulations with locked versions
      });
      setFormulations(response.data.formulations || []);
    } catch (err: any) {
      console.error('Error fetching formulations:', err);
      setError(err.response?.data?.error || 'Failed to fetch formulations');
    } finally {
      setLoading(false);
    }
  };

  const handleFormulationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formulationId = e.target.value;
    const formulation = formulations.find(f => f.id === formulationId);
    setSelectedFormulation(formulation || null);
    setSelectedVersion(null);
    setRequirements([]);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVersion(Number(e.target.value));
  };

  const calculateRequirements = () => {
    if (!selectedFormulation || selectedVersion === null || !batchSize) {
      return;
    }

    const version = selectedFormulation.versions.find(v => v.versionNumber === selectedVersion);
    if (!version) return;

    const calculated = version.ingredients.map(ing => ({
      materialId: ing.materialId,
      materialName: ing.material.name,
      percentageOrComposition: ing.percentageOrComposition,
      unit: ing.unit,
      quantityRequired: (batchSize * ing.percentageOrComposition) / 100,
      availableStock: ing.material.currentStockQty,
      materialUnit: ing.material.unit,
    }));

    setRequirements(calculated);
  };

  useEffect(() => {
    if (batchSize > 0) {
      calculateRequirements();
    }
  }, [batchSize, selectedVersion]);

  const handleNext = () => {
    if (!selectedFormulation || selectedVersion === null || !batchSize || requirements.length === 0) {
      setError('Please complete all fields');
      return;
    }

    const version = selectedFormulation.versions.find(v => v.versionNumber === selectedVersion);
    if (!version) return;

    // Check material availability
    const hasShortage = requirements.some(req => req.quantityRequired > req.availableStock);
    if (hasShortage) {
      setError('Insufficient materials in stock. Please check highlighted items.');
      return;
    }

    updateFormData({
      formulationId: selectedFormulation.id,
      formulationVersionId: version.id,
      productName: selectedFormulation.productName,
      batchSize,
      versionNumber: selectedVersion,
      ingredients: requirements,
    });

    onNext();
  };

  const lockedVersions = selectedFormulation?.versions.filter(v => v.isLocked) || [];
  const allMaterialsAvailable = requirements.length > 0 && requirements.every(req => req.quantityRequired <= req.availableStock);

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-6">Select Product & Formulation</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading formulations...</div>
      ) : (
        <div className="space-y-6">
          {/* Formulation Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Select Formulation *</label>
            <select
              value={selectedFormulation?.id || ''}
              onChange={handleFormulationChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a formulation...</option>
              {formulations.map(formulation => (
                <option key={formulation.id} value={formulation.id}>
                  {formulation.productName}
                </option>
              ))}
            </select>
          </div>

          {/* Version Selection */}
          {selectedFormulation && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Select Version (Locked Only) *</label>
              <select
                value={selectedVersion || ''}
                onChange={handleVersionChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a version...</option>
                {lockedVersions.map(version => (
                  <option key={version.id} value={version.versionNumber}>
                    Version {version.versionNumber} (Locked)
                  </option>
                ))}
              </select>
              {lockedVersions.length === 0 && (
                <p className="text-sm text-red-500">No locked versions available for this formulation</p>
              )}
            </div>
          )}

          {/* Batch Size */}
          {selectedVersion !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Batch Size (units) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchSize}
                onChange={(e) => setBatchSize(parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter batch size..."
              />
            </div>
          )}

          {/* Material Requirements */}
          {requirements.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Material Requirements</h3>
                {allMaterialsAvailable ? (
                  <Badge className="bg-green-100 text-green-700 border border-green-300 flex items-center gap-2">
                    <CheckCircle size={14} />
                    All Materials Available
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border border-red-300 flex items-center gap-2">
                    <XCircle size={14} />
                    Material Shortage
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Material</th>
                      <th className="text-right p-3 text-sm font-semibold">Composition %</th>
                      <th className="text-right p-3 text-sm font-semibold">Required</th>
                      <th className="text-right p-3 text-sm font-semibold">Available</th>
                      <th className="text-center p-3 text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req, index) => {
                      const isAvailable = req.quantityRequired <= req.availableStock;
                      return (
                        <tr key={index} className={`border-b ${!isAvailable ? 'bg-red-50' : ''}`}>
                          <td className="p-3 text-sm font-medium">{req.materialName}</td>
                          <td className="p-3 text-sm text-right">
                            {req.percentageOrComposition.toFixed(2)}%
                          </td>
                          <td className="p-3 text-sm text-right font-semibold">
                            {req.quantityRequired.toFixed(2)} {req.materialUnit}
                          </td>
                          <td className="p-3 text-sm text-right">
                            {req.availableStock.toFixed(2)} {req.materialUnit}
                          </td>
                          <td className="p-3 text-center">
                            {isAvailable ? (
                              <CheckCircle size={18} className="text-green-600 mx-auto" />
                            ) : (
                              <AlertTriangle size={18} className="text-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              onClick={handleNext}
              disabled={!allMaterialsAvailable || requirements.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next: Workers & Shift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulationSelector;

