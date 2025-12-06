import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Package, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Table from '../_components/Table';
import FormModal from '../_components/FormModal';
import api from '@/lib/api';

interface FinishedGood {
  id: string;
  batchId: string;
  productName: string;
  quantityProduced: number;
  availableQuantity: number;
  unit: string;
  unitPrice: number;
  hsnCode: string;
  qualityStatus: string;
  createdAt: string;
  batch: {
    batchCode: string;
  };
}

const columns = [
  {
    header: "Product Name",
    accessor: "productName",
  },
  {
    header: "Batch Code",
    accessor: "batchCode",
  },
  {
    header: "Produced",
    accessor: "quantityProduced",
    className: "hidden md:table-cell",
  },
  {
    header: "Available",
    accessor: "availableQuantity",
  },
  {
    header: "Unit Price",
    accessor: "unitPrice",
    className: "hidden lg:table-cell",
  },
  {
    header: "HSN Code",
    accessor: "hsnCode",
    className: "hidden lg:table-cell",
  },
  {
    header: "Quality",
    accessor: "qualityStatus",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const qualityStatusColors: Record<string, string> = {
  Approved: "bg-green-100 text-green-700 border-green-300",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Rejected: "bg-red-100 text-red-700 border-red-300",
};

const FinishedGoods = () => {
  const navigate = useNavigate();
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    qualityStatus: "",
    availableOnly: false,
  });

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filters.qualityStatus) params.qualityStatus = filters.qualityStatus;
      if (filters.availableOnly) params.availableOnly = 'true';

      const response = await api.get("/api/finished-goods", { params });
      setFinishedGoods(response.data.finishedGoods || []);
    } catch (err: any) {
      console.error("Error fetching finished goods:", err);
      setError(err.response?.data?.error || "Failed to fetch finished goods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFinishedGoods();
  };

  // Filter locally by search
  const filteredGoods = finishedGoods.filter(item =>
    filters.search
      ? item.productName.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.batch.batchCode.toLowerCase().includes(filters.search.toLowerCase())
      : true
  );

  const rowLoader = (item: FinishedGood) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2 font-semibold">{item.productName}</td>
        <td className="py-3 px-2 font-mono text-sm">{item.batch.batchCode}</td>
        <td className="hidden md:table-cell py-3 px-2">{item.quantityProduced.toFixed(2)} {item.unit || 'pieces'}</td>
        <td className="py-3 px-2 font-semibold">
          {item.availableQuantity.toFixed(2)} {item.unit || 'pieces'}
          {item.availableQuantity === 0 && (
            <span className="ml-2 text-xs text-red-500">(Out of Stock)</span>
          )}
        </td>
        <td className="hidden lg:table-cell py-3 px-2">₹{item.unitPrice.toFixed(2)}/{item.unit || 'piece'}</td>
        <td className="hidden lg:table-cell py-3 px-2 font-mono text-sm">{item.hsnCode}</td>
        <td className="py-3 px-2">
          <Badge className={`border ${qualityStatusColors[item.qualityStatus]}`}>
            {item.qualityStatus}
          </Badge>
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/production/batch-production/${item.batchId}`)}
              className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer"
              title="View Batch Details"
            >
              <Eye size={16} />
            </Button>
            <FormModal table="FinishedGoods" type="update" id={item.id} data={item} />
            <FormModal table="FinishedGoods" type="delete" id={item.id} data={item} />
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
          <h1 className="text-xl font-semibold">Finished Goods Inventory</h1>
          <p className="text-sm text-gray-500">Manage post-production inventory and track stock</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={fetchFinishedGoods}
            className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <FormModal table="FinishedGoods" type="create" />
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
            placeholder="Search by Product Name or Batch Code"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="qualityStatus"
            value={filters.qualityStatus}
            onChange={handleFilterChange}
          >
            <option value="">All Quality Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              name="availableOnly"
              checked={filters.availableOnly}
              onChange={handleFilterChange}
              className="w-4 h-4"
            />
            <span className="text-sm">Available Only</span>
          </label>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2"
          >
            Search
          </button>
        </div>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-blue-600" />
            <p className="text-sm text-blue-600">Total Products</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{filteredGoods.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-2">Total Available</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredGoods.reduce((sum, item) => sum + item.availableQuantity, 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">(mixed units)</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-yellow-900">
            {filteredGoods.filter(item => item.availableQuantity === 0).length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-2">Pending QC</p>
          <p className="text-2xl font-bold text-purple-900">
            {filteredGoods.filter(item => item.qualityStatus === 'Pending').length}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading finished goods...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredGoods.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No finished goods found. Add products from completed batches!
        </div>
      ) : (
        <Table columns={columns} data={filteredGoods} renderRow={rowLoader} />
      )}
    </div>
  );
};

export default FinishedGoods;

