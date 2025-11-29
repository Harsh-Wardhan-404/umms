import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface QualityCheckFormProps {
  batchId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
}

const checkTypes = [
  'Visual Inspection',
  'Weight Check',
  'pH Test',
  'Viscosity Test',
  'Color Match',
  'Fragrance Check',
  'Packaging Integrity',
  'Label Verification',
  'Microbial Test',
  'Stability Test',
  'Other',
];

const QualityCheckForm = ({ batchId, setOpen, onSuccess }: QualityCheckFormProps) => {
  const { user } = useAuth();
  const [checkType, setCheckType] = useState('Visual Inspection');
  const [customCheckType, setCustomCheckType] = useState('');
  const [result, setResult] = useState<'pass' | 'fail'>('pass');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const finalCheckType = checkType === 'Other' ? customCheckType : checkType;

      if (!finalCheckType) {
        setError('Please specify the check type');
        return;
      }

      const requestBody = {
        checkType: finalCheckType,
        result,
        notes,
        inspectorId: user?.id,
      };

      await api.post(`/api/batches/${batchId}/quality-checks`, requestBody);
      onSuccess();
      setOpen(false);
    } catch (err: any) {
      console.error('Error adding quality check:', err);
      setError(err.response?.data?.error || 'Failed to add quality check');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full">
        <div className="border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Quality Check</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Inspector (Auto-filled) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Inspector</p>
            <p className="font-semibold text-blue-900">
              {user?.firstName} {user?.lastName} ({user?.role})
            </p>
          </div>

          {/* Check Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Check Type *</label>
            <select
              value={checkType}
              onChange={(e) => setCheckType(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {checkTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Custom Check Type (if Other) */}
          {checkType === 'Other' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Specify Check Type *</label>
              <input
                type="text"
                value={customCheckType}
                onChange={(e) => setCustomCheckType(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter custom check type..."
              />
            </div>
          )}

          {/* Result */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Result *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setResult('pass')}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  result === 'pass'
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                ✓ Pass
              </button>
              <button
                onClick={() => setResult('fail')}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  result === 'fail'
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                }`}
              >
                ✗ Fail
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Notes *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
              placeholder="Add detailed notes about this quality check..."
            />
            <p className="text-xs text-gray-500">
              Include observations, measurements, and any issues found
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !notes}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Add Quality Check'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityCheckForm;

