import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, RefreshCw, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import FormModal from '../_components/FormModal';

interface Dispatch {
  id: string;
  courierName: string;
  awbNumber: string;
  dispatchDate: string;
  status: 'Ready' | 'InTransit' | 'Delivered';
  invoice: {
    invoiceNumber: string;
    totalAmount: number;
    client: {
      name: string;
    };
  };
  feedback?: {
    id: string;
    ratingQuality: number;
    ratingPackaging: number;
    ratingDelivery: number;
  };
}

interface Stats {
  total: number;
  ready: number;
  inTransit: number;
  delivered: number;
  pendingFeedback: number;
}

const Dispatches = () => {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    ready: 0,
    inTransit: 0,
    delivered: 0,
    pendingFeedback: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [courierSearch, setCourierSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: 1,
        limit: 100
      };

      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter;
      }

      if (courierSearch) {
        params.courierName = courierSearch;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await api.get('/api/dispatches', { params });
      setDispatches(response.data.dispatches);
      setStats(response.data.stats);
    } catch (err: any) {
      console.error('Error fetching dispatches:', err);
      setError(err.response?.data?.error || 'Failed to fetch dispatches');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDispatches();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Ready: 'bg-blue-100 text-blue-700 border-blue-300',
      InTransit: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Delivered: 'bg-green-100 text-green-700 border-green-300'
    };

    const labels = {
      Ready: 'Ready',
      InTransit: 'In Transit',
      Delivered: 'Delivered'
    };

    return (
      <Badge className={`border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading && dispatches.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading dispatches...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dispatch Management</h1>
          <p className="text-sm text-gray-500">Track and manage product dispatches</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchDispatches}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
          <FormModal table="Dispatches" type="create" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-blue-500" />
            <p className="text-sm text-gray-500">Total Dispatches</p>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-gray-500 mb-2">Ready</p>
          <p className="text-2xl font-bold text-blue-700">{stats.ready}</p>
        </div>

        <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
          <p className="text-sm text-gray-500 mb-2">In Transit</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.inTransit}</p>
        </div>

        <div className="border border-green-300 rounded-lg p-4 bg-green-50">
          <p className="text-sm text-gray-500 mb-2">Delivered</p>
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
        </div>

        <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
          <p className="text-sm text-gray-500 mb-2">Pending Feedback</p>
          <p className="text-2xl font-bold text-orange-700">{stats.pendingFeedback}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="All">All Status</option>
              <option value="Ready">Ready</option>
              <option value="InTransit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Courier Name</label>
            <input
              type="text"
              value={courierSearch}
              onChange={(e) => setCourierSearch(e.target.value)}
              placeholder="Search courier..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Search AWB/Invoice</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="AWB or Invoice #"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Search size={16} />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Dispatches Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="text-left p-3">Invoice Number</th>
                <th className="text-left p-3">Client Name</th>
                <th className="text-left p-3">Courier Name</th>
                <th className="text-left p-3">AWB Number</th>
                <th className="text-left p-3">Dispatch Date</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Feedback</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No dispatches found
                  </td>
                </tr>
              ) : (
                dispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-xs">
                        {dispatch.invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="p-3">{dispatch.invoice.client.name}</td>
                    <td className="p-3">{dispatch.courierName}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs">{dispatch.awbNumber}</span>
                    </td>
                    <td className="p-3">
                      {new Date(dispatch.dispatchDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3">{getStatusBadge(dispatch.status)}</td>
                    <td className="p-3">
                      {dispatch.status === 'Delivered' && !dispatch.feedback && (
                        <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
                          Pending
                        </Badge>
                      )}
                      {dispatch.feedback && (
                        <Badge className="bg-green-100 text-green-700 border border-green-300">
                          Submitted
                        </Badge>
                      )}
                      {dispatch.status !== 'Delivered' && (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/sales/dispatches/${dispatch.id}`)}
                          className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <FormModal
                          table="Dispatches"
                          type="delete"
                          id={dispatch.id}
                          data={dispatch}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dispatches;

