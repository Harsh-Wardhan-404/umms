import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, QrCode, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Table from '../_components/Table';
import FormModal from '../_components/FormModal';
import api from '@/lib/api';

interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  status: 'Planned' | 'InProgress' | 'QualityCheck' | 'Completed' | 'Cancelled';
  shift: string;
  startTime: string;
  endTime?: string;
  supervisor: {
    firstName: string;
    lastName: string;
  };
}

const columns = [
  {
    header: "Batch Code",
    accessor: "batchCode",
  },
  {
    header: "Product Name",
    accessor: "productName",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Shift",
    accessor: "shift",
    className: "hidden md:table-cell",
  },
  {
    header: "Start Time",
    accessor: "startTime",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const statusColors: Record<string, string> = {
  Planned: "bg-blue-100 text-blue-700 border-blue-300",
  InProgress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  QualityCheck: "bg-purple-100 text-purple-700 border-purple-300",
  Completed: "bg-green-100 text-green-700 border-green-300",
  Cancelled: "bg-red-100 text-red-700 border-red-300",
};

const BatchProduction = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    shift: "",
    startDate: "",
    endDate: "",
  });

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.shift) params.shift = filters.shift;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get("/api/batches", { params });
      setBatches(response.data.batches || []);
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      setError(err.response?.data?.error || "Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBatches();
  };

  // Filter batches by search locally
  const filteredBatches = batches.filter(batch =>
    filters.search
      ? batch.batchCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        batch.productName.toLowerCase().includes(filters.search.toLowerCase())
      : true
  );

  const rowLoader = (batch: Batch) => {
    return (
      <tr
        key={batch.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2 font-mono font-semibold">{batch.batchCode}</td>
        <td className="py-3 px-2">{batch.productName}</td>
        <td className="py-3 px-2">
          <Badge className={`border ${statusColors[batch.status]}`}>
            {batch.status}
          </Badge>
        </td>
        <td className="hidden md:table-cell py-3 px-2">{batch.shift}</td>
        <td className="hidden lg:table-cell py-3 px-2">
          {new Date(batch.startTime).toLocaleString()}
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/production/batch-production/${batch.id}`)}
              className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer"
            >
              <Eye size={16} />
            </Button>
            <Button
              onClick={() => navigate(`/production/batch-production/${batch.id}#qr`)}
              className="flex justify-center items-center w-8 h-8 bg-green-300 border-1 border-green-500 !text-green-700 hover:bg-green-400 rounded-md cursor-pointer"
              title="View QR Code"
            >
              <QrCode size={16} />
            </Button>
            <FormModal table="BatchProduction" type="delete" id={batch.id} data={batch} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Batch Production</h1>
          <p className="text-sm text-gray-500">Manage production batches with real-time tracking</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={fetchBatches}
            className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/production/batch-production/create')}
            className="flex justify-center items-center bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <Plus size={16} />
            Create Batch
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Filters */}
      <form className="relative w-full border border-gray-300 rounded-md p-4" onSubmit={handleSearch}>
        <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">
          Filters
        </span>
        <div className="flex gap-4 w-full flex-wrap">
          <input
            type="text"
            placeholder="Search by Batch Code or Product Name"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="InProgress">In Progress</option>
            <option value="QualityCheck">Quality Check</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="shift"
            value={filters.shift}
            onChange={handleFilterChange}
          >
            <option value="">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2"
          >
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading batches...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No batches found. Create your first batch to get started!
        </div>
      ) : (
        <Table columns={columns} data={filteredBatches} renderRow={rowLoader} />
      )}
    </div>
  );
};

export default BatchProduction;
