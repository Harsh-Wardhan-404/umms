import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../lib/api";
import StarRating from "../../ui/StarRating";
import EfficiencyBadge from "../../ui/EfficiencyBadge";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Download,
  BarChart3,
} from "lucide-react";
import AddFeedbackModal from "./AddFeedbackModal";

interface WorkerData {
  worker: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
  };
  efficiency: {
    outputEfficiency: number;
    punctualityScore: number;
    feedbackScore: number;
    overallRating: number;
    totalBatches: number;
    onTimeBatches: number;
    positiveFeedbackCount: number;
    negativeFeedbackCount: number;
  };
  standardOutput: number;
  recentFeedbacks: Array<{
    id: string;
    feedbackTag: string;
    comments: string | null;
    supervisor: string;
    createdAt: string;
  }>;
  lastCalculated: string | null;
}

interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  batchSize: number;
  startTime: string;
  endTime: string | null;
  durationHours: string | null;
  isOnTime: boolean | null;
  efficiency: string;
  status: string;
  supervisor: string;
}

const WorkerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "feedback" | "reports">(
    "overview"
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchWorkerData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "batches") {
      fetchBatches();
    } else if (activeTab === "feedback") {
      fetchFeedbacks();
    }
  }, [activeTab, id]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/worker-efficiency/${id}`);
      setWorkerData(response.data);
    } catch (error) {
      console.error("Error fetching worker data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get(`/api/worker-efficiency/${id}/batches`);
      setBatches(response.data.batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get(`/api/worker-efficiency/${id}/feedback`);
      setFeedbacks(response.data.feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const downloadReport = async (format: "pdf" | "excel") => {
    try {
      const response = await api.get(
        `/api/worker-efficiency/${id}/report/${format}?month=${selectedMonth}&year=${selectedYear}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `worker-report-${id}-${selectedYear}-${selectedMonth}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workerData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Worker data not found</div>
      </div>
    );
  }

  const { worker, efficiency, standardOutput, recentFeedbacks } = workerData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/performance/workers"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workers
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{worker.name}</h1>
              <p className="text-gray-600 mt-1">@{worker.username}</p>
              <p className="text-sm text-gray-500 mt-1">{worker.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                {worker.role}
              </span>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Overall Performance</p>
              <StarRating rating={efficiency.overallRating} size="lg" />
              {workerData.lastCalculated && (
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(workerData.lastCalculated).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={`px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === "batches"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Batch History
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === "feedback"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-6 py-4 border-b-2 font-medium text-sm ${
                activeTab === "reports"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reports
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Output Efficiency</p>
                      <p className="text-3xl font-bold text-blue-700 mt-2">
                        {efficiency.outputEfficiency.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">vs Standard: {standardOutput} units</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Punctuality Score</p>
                      <p className="text-3xl font-bold text-green-700 mt-2">
                        {efficiency.punctualityScore.toFixed(1)}%
                      </p>
                    </div>
                    <Clock className="w-10 h-10 text-green-600 opacity-50" />
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    {efficiency.onTimeBatches}/{efficiency.totalBatches} batches on time
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">Feedback Score</p>
                      <p className="text-3xl font-bold text-purple-700 mt-2">
                        {efficiency.feedbackScore.toFixed(1)}%
                      </p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-purple-600 opacity-50" />
                  </div>
                  <p className="text-xs text-purple-700 mt-2">
                    {efficiency.positiveFeedbackCount} positive, {efficiency.negativeFeedbackCount}{" "}
                    negative
                  </p>
                </div>
              </div>

              {/* Batches Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Batch Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Batches</p>
                    <p className="text-2xl font-bold text-gray-800">{efficiency.totalBatches}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">On Time</p>
                    <p className="text-2xl font-bold text-green-600">{efficiency.onTimeBatches}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Late</p>
                    <p className="text-2xl font-bold text-red-600">
                      {efficiency.totalBatches - efficiency.onTimeBatches}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Standard Output</p>
                    <p className="text-2xl font-bold text-gray-800">{standardOutput}</p>
                  </div>
                </div>
              </div>

              {/* Recent Feedback */}
              {recentFeedbacks.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Feedback</h3>
                  <div className="space-y-3">
                    {recentFeedbacks.slice(0, 5).map((feedback) => (
                      <div
                        key={feedback.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            ["Excellent", "Good"].includes(feedback.feedbackTag)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {feedback.feedbackTag}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{feedback.comments || "No comments"}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {feedback.supervisor} •{" "}
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batches Tab */}
          {activeTab === "batches" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Batch History</h3>
                <p className="text-sm text-gray-600">Total: {batches.length} batches</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Batch Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Output
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        On Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No batches found
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            <Link to={`/production/batch-production/${batch.id}`}>
                              {batch.batchCode}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{batch.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {batch.batchSize} ({batch.efficiency}%)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {batch.durationHours ? `${batch.durationHours}h` : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {batch.isOnTime !== null ? (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  batch.isOnTime
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {batch.isOnTime ? "Yes" : "No"}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                              {batch.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Feedback Timeline</h3>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Feedback
                </button>
              </div>

              <div className="space-y-4">
                {feedbacks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No feedback yet</p>
                ) : (
                  feedbacks.map((feedback) => (
                    <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded ${
                                ["Excellent", "Good"].includes(feedback.feedbackTag)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {feedback.feedbackTag}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {feedback.comments && (
                            <p className="text-sm text-gray-700 mb-2">{feedback.comments}</p>
                          )}
                          <p className="text-xs text-gray-500">By {feedback.supervisor}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Monthly Report</h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadReport("pdf")}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => downloadReport("excel")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Excel
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Report Includes:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Performance summary and star rating
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Detailed batch history for the month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    All supervisor feedback received
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Efficiency metrics and recommendations
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <AddFeedbackModal
          workerId={worker.id}
          workerName={worker.name}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            fetchFeedbacks();
            fetchWorkerData();
            setShowFeedbackModal(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkerDetails;

