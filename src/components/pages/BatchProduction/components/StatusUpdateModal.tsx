import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface StatusUpdateModalProps {
  batchId: string;
  currentStatus: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
}

const StatusUpdateModal = ({ batchId, currentStatus, setOpen, onSuccess }: StatusUpdateModalProps) => {
  const [status, setStatus] = useState(currentStatus);
  const [endTime, setEndTime] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);

      const requestBody: any = {
        status,
        productionNotes,
      };

      if (status === 'Completed' && endTime) {
        requestBody.endTime = new Date(endTime).toISOString();
      }

      await api.patch(`/api/batches/${batchId}/status`, requestBody);
      onSuccess();
      setOpen(false);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full">
        <div className="border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Update Batch Status</h2>
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

          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Current Status</p>
            <p className="text-lg font-semibold">{currentStatus}</p>
          </div>

          {/* New Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">New Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Planned">Planned</option>
              <option value="InProgress">In Progress</option>
              <option value="QualityCheck">Quality Check</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* End Time (only for Completed) */}
          {status === 'Completed' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">End Time (Optional)</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Leave empty to use current time
              </p>
            </div>
          )}

          {/* Production Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Update Notes (Optional)</label>
            <textarea
              value={productionNotes}
              onChange={(e) => setProductionNotes(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
              placeholder="Add notes about this status update..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;

