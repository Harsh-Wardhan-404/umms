import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { BatchFormData } from '../CreateBatchWizard';

interface WorkerShiftSelectorProps {
  formData: Partial<BatchFormData>;
  updateFormData: (data: Partial<BatchFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

const WorkerShiftSelector = ({ formData, updateFormData, onNext, onBack }: WorkerShiftSelectorProps) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(formData.workers || []);
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Night'>(formData.shift || 'Morning');
  const [startTime, setStartTime] = useState<string>(formData.startTime || '');
  const [productionNotes, setProductionNotes] = useState<string>(formData.productionNotes || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      // Filter for Staff and Supervisor roles
      const workers = response.data.users.filter((u: User) =>
        ['Staff', 'Supervisor'].includes(u.role)
      );
      setUsers(workers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleNext = () => {
    if (selectedWorkers.length === 0) {
      setError('Please select at least one worker');
      return;
    }

    if (!startTime) {
      setError('Please select a start time');
      return;
    }

    // Check if start time is not in the past
    const selectedDate = new Date(startTime);
    const now = new Date();
    if (selectedDate < now) {
      setError('Start time cannot be in the past');
      return;
    }

    updateFormData({
      workers: selectedWorkers,
      shift,
      startTime,
      productionNotes,
    });

    onNext();
  };

  // Set default start time to current time if not set
  useEffect(() => {
    if (!startTime) {
      const now = new Date();
      // Format for datetime-local input
      const formatted = now.toISOString().slice(0, 16);
      setStartTime(formatted);
    }
  }, []);

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-6">Workers & Shift Details</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Supervisor Info (Auto-assigned) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-600" />
            <h3 className="font-semibold text-blue-900">Supervisor (Auto-assigned)</h3>
          </div>
          <p className="text-sm text-blue-800">
            {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
          </p>
        </div>

        {/* Worker Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Users size={16} />
            Select Workers *
          </label>
          {loading ? (
            <div className="text-center py-4">Loading workers...</div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">No workers available</p>
              ) : (
                <div className="space-y-2">
                  {users.map(worker => (
                    <div
                      key={worker.id}
                      onClick={() => handleWorkerToggle(worker.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        selectedWorkers.includes(worker.id)
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {worker.firstName} {worker.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{worker.email}</p>
                      </div>
                      <Badge variant="outline">{worker.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Selected: {selectedWorkers.length} worker{selectedWorkers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Shift Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Clock size={16} />
            Select Shift *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {['Morning', 'Evening', 'Night'].map((shiftOption) => (
              <button
                key={shiftOption}
                type="button"
                onClick={() => setShift(shiftOption as any)}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  shift === shiftOption
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {shiftOption}
              </button>
            ))}
          </div>
        </div>

        {/* Start Time */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Production Start Time *</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Production Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Production Notes (Optional)</label>
          <textarea
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            placeholder="Add any special instructions or notes for this batch..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-6 py-2"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedWorkers.length === 0 || !startTime}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next: Review & Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkerShiftSelector;

