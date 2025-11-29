import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Eye, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Table from '../_components/Table';
import FormModal from '../_components/FormModal';
import api from '@/lib/api';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  contactPerson: string;
  creditLimit: number;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
}

const columns = [
  {
    header: "Client Name",
    accessor: "name",
  },
  {
    header: "Contact Person",
    accessor: "contactPerson",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden md:table-cell",
  },
  {
    header: "GST Number",
    accessor: "gstNumber",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (!showInactive) params.isActive = 'true';

      const response = await api.get("/api/clients", { params });
      setClients(response.data.clients || []);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      setError(err.response?.data?.error || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [showInactive]);

  const filteredClients = clients.filter(client =>
    search
      ? client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const rowLoader = (client: Client) => {
    return (
      <tr
        key={client.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <span className="font-semibold">{client.name}</span>
          </div>
        </td>
        <td className="py-3 px-2">{client.contactPerson || '-'}</td>
        <td className="hidden md:table-cell py-3 px-2">{client.phone || '-'}</td>
        <td className="hidden lg:table-cell py-3 px-2 font-mono text-sm">{client.gstNumber || '-'}</td>
        <td className="py-3 px-2">
          <Badge className={`border ${
            client.isActive
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}>
            {client.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/sales/clients/${client.id}`)}
              className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer"
              title="View Details"
            >
              <Eye size={16} />
            </Button>
            <FormModal table="Clients" type="update" id={client.id} data={client} />
            <FormModal table="Clients" type="delete" id={client.id} data={client} />
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
          <h1 className="text-xl font-semibold">Client Management</h1>
          <p className="text-sm text-gray-500">Manage customers and billing information</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={fetchClients}
            className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <FormModal table="Clients" type="create" />
        </div>
      </div>

      <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Search & Filter */}
      <div className="flex gap-4 w-full flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, or contact person"
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show Inactive</span>
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-2">Total Clients</p>
          <p className="text-2xl font-bold text-blue-900">{filteredClients.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-2">Active</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredClients.filter(c => c.isActive).length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Inactive</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredClients.filter(c => !c.isActive).length}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading clients...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No clients found. Add your first client to get started!
        </div>
      ) : (
        <Table columns={columns} data={filteredClients} renderRow={rowLoader} />
      )}
    </div>
  );
};

export default Clients;

