import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../../../lib/api";

interface AddFeedbackModalProps {
  workerId: string;
  workerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  startTime: string;
}

const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({
  workerId,
  workerName,
  onClose,
  onSuccess,
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [feedbackTag, setFeedbackTag] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkerBatches();
  }, [workerId]);

  const fetchWorkerBatches = async () => {
    try {
      const response = await api.get(`/api/worker-efficiency/${workerId}/batches?status=Completed`);
      setBatches(response.data.batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to load batches");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedBatch) {
      setError("Please select a batch");
      return;
    }

    if (!feedbackTag) {
      setError("Please select a feedback tag");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/worker-efficiency/${workerId}/feedback`, {
        batchId: selectedBatch,
        feedbackTag,
        comments: comments || null,
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error adding feedback:", error);
      setError(error.response?.data?.error || "Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  const feedbackTags = [
    { value: "Excellent", label: "✅ Excellent", color: "bg-green-100 text-green-800 border-green-300" },
    { value: "Good", label: "✅ Good", color: "bg-blue-100 text-blue-800 border-blue-300" },
    { value: "Needs Improvement", label: "⚠️ Needs Improvement", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    { value: "Late", label: "⚠️ Late", color: "bg-red-100 text-red-800 border-red-300" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add Feedback</h2>
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

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">-- Select a batch --</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} - {batch.productName} ({new Date(batch.startTime).toLocaleDateString()})
                </option>
              ))}
            </select>
            {batches.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No completed batches available</p>
            )}
          </div>

          {/* Feedback Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Tag <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setFeedbackTag(tag.value)}
                  className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition ${
                    feedbackTag === tag.value
                      ? `${tag.color} border-opacity-100`
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add any additional comments..."
            />
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
              disabled={loading || !selectedBatch || !feedbackTag}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeedbackModal;

