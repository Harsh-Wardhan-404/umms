import React, { useState } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";

interface SetStandardOutputModalProps {
  userId: string;
  workerName: string;
  currentStandardOutput: number;
  onClose: () => void;
  onSuccess: () => void;
}

const SetStandardOutputModal: React.FC<SetStandardOutputModalProps> = ({
  userId,
  workerName,
  currentStandardOutput,
  onClose,
  onSuccess,
}) => {
  const [standardOutput, setStandardOutput] = useState(currentStandardOutput.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const value = parseFloat(standardOutput);
    if (isNaN(value) || value <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    try {
      setLoading(true);
      
      // First, create or update worker efficiency record
      await api.post(`/api/worker-efficiency/${userId}/set-standard-output`, {
        standardOutputQtyPerShift: value,
      });

      // Then trigger recalculation
      await api.post(`/api/worker-efficiency/${userId}/calculate`);
      
      onSuccess();
    } catch (error: any) {
      console.error("Error setting standard output:", error);
      setError(error.response?.data?.error || "Failed to set standard output");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Set Standard Output</h2>
            <p className="text-sm text-gray-600 mt-1">For: {workerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What is Standard Output?</h3>
            <p className="text-xs text-blue-800">
              Standard Output is the expected production quantity per shift for this worker. 
              It's used to calculate output efficiency: (Actual Output / Standard Output) × 100%
            </p>
          </div>

          {/* Standard Output Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard Output per Shift <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={standardOutput}
                onChange={(e) => setStandardOutput(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                units
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current: {currentStandardOutput > 0 ? `${currentStandardOutput} units` : "Not set"}
            </p>
          </div>

          {/* Examples */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Examples:</p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>Production worker: 100 units per shift</li>
              <li>Packaging worker: 150 units per shift</li>
              <li>Quality control: 80 units per shift</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !standardOutput}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save & Recalculate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetStandardOutputModal;

