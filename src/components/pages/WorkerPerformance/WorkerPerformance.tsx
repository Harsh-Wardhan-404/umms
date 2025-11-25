import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../lib/api";
import StarRating from "../../ui/StarRating";
import EfficiencyBadge from "../../ui/EfficiencyBadge";
import { Search, Filter, TrendingUp, TrendingDown, Eye, RefreshCw } from "lucide-react";

interface WorkerData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  efficiencyRating: number;
  punctualityScore: number;
  totalBatchesCompleted: number;
  onTimeBatches: number;
  lastCalculated: string | null;
}

interface StatsData {
  totalWorkers: number;
  avgEfficiency: string;
  topPerformer: {
    id: string;
    name: string;
    rating: number;
  } | null;
  needAttention: number;
}

const WorkerPerformance: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("efficiencyRating");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWorkerPerformance();
  }, [page, sortBy, sortOrder, minRating, maxRating, roleFilter]);

  const fetchWorkerPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (minRating) params.append("minRating", minRating);
      if (maxRating) params.append("maxRating", maxRating);
      if (roleFilter) params.append("role", roleFilter);

      const response = await api.get(`/api/worker-efficiency?${params.toString()}`);
      setWorkers(response.data.data);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching worker performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Worker Performance</h1>
          <p className="text-gray-600 mt-1">Track and analyze worker efficiency metrics</p>
        </div>
        <button
          onClick={fetchWorkerPerformance}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Workers</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalWorkers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Efficiency</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.avgEfficiency}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div>
              <p className="text-sm text-gray-600 font-medium">Top Performer</p>
              {stats.topPerformer ? (
                <>
                  <p className="text-xl font-bold text-gray-800 mt-1 truncate">
                    {stats.topPerformer.name}
                  </p>
                  <StarRating rating={stats.topPerformer.rating} size="sm" />
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">No data</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Need Attention</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.needAttention}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="efficiencyRating">Sort by Rating</option>
            <option value="punctualityScore">Sort by Punctuality</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          {/* Min Rating */}
          <input
            type="number"
            placeholder="Min Rating"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            min="0"
            max="5"
            step="0.1"
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Max Rating */}
          <input
            type="number"
            placeholder="Max Rating"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            min="0"
            max="5"
            step="0.1"
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Staff">Staff</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Punctuality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No workers found. Complete batches to see performance data.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                            <div className="text-sm text-gray-500">{worker.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {worker.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StarRating rating={worker.efficiencyRating} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  worker.punctualityScore >= 80
                                    ? "bg-green-500"
                                    : worker.punctualityScore >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${worker.punctualityScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-700">
                              {worker.punctualityScore.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {worker.totalBatchesCompleted}
                            <span className="text-gray-500 ml-1">
                              ({worker.onTimeBatches} on time)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {worker.lastCalculated
                            ? new Date(worker.lastCalculated).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/performance/workers/${worker.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkerPerformance;

