import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface StatusUpdateModalProps {
  dispatch: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdate: () => void;
}

const StatusUpdateModal = ({ dispatch, setOpen, onUpdate }: StatusUpdateModalProps) => {
  const [newStatus, setNewStatus] = useState(dispatch.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'Ready', label: 'Ready' },
    { value: 'InTransit', label: 'In Transit' },
    { value: 'Delivered', label: 'Delivered' }
  ];

  // Get only forward status options
  const currentIndex = statusOptions.findIndex(opt => opt.value === dispatch.status);
  const availableOptions = statusOptions.filter((_, index) => index >= currentIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newStatus === dispatch.status) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/api/dispatches/${dispatch.id}/status`, {
        status: newStatus
      });

      // If status is now Delivered and there's a prompt for feedback
      if (response.data.promptFeedback) {
        alert('Status updated to Delivered. You can now add feedback.');
      }

      setOpen(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1A1C22] rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Update Dispatch Status</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Status */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-[#282C35] dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Status</p>
            <p className="font-semibold text-lg dark:text-white">
              {statusOptions.find(opt => opt.value === dispatch.status)?.label}
            </p>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            >
              {availableOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Status can only progress forward (Ready → In Transit → Delivered)
            </p>
          </div>

          {/* Info for Delivered Status */}
          {newStatus === 'Delivered' && dispatch.status !== 'Delivered' && (
            <div className="flex gap-2 p-3 bg-blue-50 border border-blue-300 rounded-lg">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Feedback Available</p>
                <p className="text-xs text-blue-600 mt-1">
                  After updating to "Delivered", you'll be able to capture client feedback on the dispatch details page.
                </p>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="border border-orange-300 rounded-lg p-3 bg-orange-50">
            <p className="text-sm text-orange-800">
              <span className="font-medium">Confirmation:</span> Are you sure you want to update the dispatch status?
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || newStatus === dispatch.status}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;

