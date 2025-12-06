import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Eye, Printer, FileText, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Table from '../_components/Table';
import api from '@/lib/api';
import { formatIndianCurrency } from '@/lib/gstCalculator';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  totalAmount: number;
  paymentStatus: string;
  client: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const columns = [
  {
    header: "Invoice Number",
    accessor: "invoiceNumber",
  },
  {
    header: "Client",
    accessor: "client",
  },
  {
    header: "Invoice Date",
    accessor: "invoiceDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Amount",
    accessor: "totalAmount",
  },
  {
    header: "Payment Status",
    accessor: "paymentStatus",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const paymentStatusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Partial: "bg-blue-100 text-blue-700 border-blue-300",
  Paid: "bg-green-100 text-green-700 border-green-300",
};

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get("/api/invoices", { params });
      setInvoices(response.data.invoices || []);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.response?.data?.error || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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
    fetchInvoices();
  };

  // Filter locally by search
  const filteredInvoices = invoices.filter(invoice =>
    filters.search
      ? invoice.invoiceNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(filters.search.toLowerCase())
      : true
  );

  const rowLoader = (invoice: Invoice) => {
    return (
      <tr
        key={invoice.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2 font-mono font-semibold">{invoice.invoiceNumber}</td>
        <td className="py-3 px-2">{invoice.client.name}</td>
        <td className="hidden md:table-cell py-3 px-2">
          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
        </td>
        <td className="py-3 px-2 font-semibold">
          {formatIndianCurrency(invoice.totalAmount)}
        </td>
        <td className="py-3 px-2">
          <Badge className={`border ${paymentStatusColors[invoice.paymentStatus]}`}>
            {invoice.paymentStatus}
          </Badge>
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
              className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer"
              title="View Invoice"
            >
              <Eye size={16} />
            </Button>
            <Button
              onClick={() => navigate(`/sales/invoices/${invoice.id}/edit`)}
              className="flex justify-center items-center w-8 h-8 bg-yellow-300 border-1 border-yellow-500 !text-yellow-700 hover:bg-yellow-400 rounded-md cursor-pointer"
              title="Edit Invoice"
            >
              <Edit size={16} />
            </Button>
            <Button
              onClick={() => navigate(`/sales/invoices/${invoice.id}/print`)}
              className="flex justify-center items-center w-8 h-8 bg-green-300 border-1 border-green-500 !text-green-700 hover:bg-green-400 rounded-md cursor-pointer"
              title="Print Invoice"
            >
              <Printer size={16} />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.paymentStatus === 'Pending').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.paymentStatus === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Invoices & Billing</h1>
          <p className="text-sm text-gray-500">Manage GST-compliant invoices and payments</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={fetchInvoices}
            className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/sales/invoices/create')}
            className="flex justify-center items-center bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <Plus size={16} />
            Create Invoice
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
            placeholder="Search by Invoice Number or Client Name"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="paymentStatus"
            value={filters.paymentStatus}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start Date"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End Date"
          />
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
            <FileText size={20} className="text-blue-600" />
            <p className="text-sm text-blue-600">Total Invoices</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{filteredInvoices.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-2">Total Amount</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatIndianCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-2">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">
            {formatIndianCurrency(pendingAmount)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-2">Paid</p>
          <p className="text-2xl font-bold text-green-900">
            {formatIndianCurrency(paidAmount)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading invoices...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invoices found. Create your first invoice to get started!
        </div>
      ) : (
        <Table columns={columns} data={filteredInvoices} renderRow={rowLoader} />
      )}
    </div>
  );
};

export default Invoices;

