import { Download, Eye, RefreshCw, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import FormModal from "../_components/FormModal";
import Table from "../_components/Table";
import type { Formulation } from "@/lib/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const columns = [
  {
    header: "Formulation Name",
    accessor: "formulationName",
  },
  {
    header: "Latest Version",
    accessor: "latestVersion",
  },
  {
    header: "Created at",
    accessor: "createdAt",
    className: "hidden md:table-cell",
  },
  {
    header: "Updated at",
    accessor: "updatedAt",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const FormulationsAndRnD = () => {
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    category: "",
    status: ""
  });

  // Fetch formulations from backend
  const fetchFormulations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filters.status === "locked") params.locked = true;

      const response = await api.get("/api/formulations", { params });
      setFormulations(response.data.formulations || []);
    } catch (err: any) {
      console.error("Error fetching formulations:", err);
      setError(err.response?.data?.error || "Failed to fetch formulations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormulations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFormulations();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  const rowLoader = (item: Formulation) => {
    const latestVersion = item.versions?.[0]; // Versions are ordered desc by versionNumber
    const hasLockedVersion = item.versions?.some(v => v.isLocked);
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2">
          <div className="flex items-center gap-2">
            {item.productName}
            {hasLockedVersion && (
              <Lock size={14} className="text-green-600" />
            )}
          </div>
        </td>
        <td className="py-3 px-2">
          <div className="flex items-center gap-2">
            V{latestVersion?.versionNumber || 1}
            {latestVersion?.isLocked && (
              <Badge className="bg-green-100 text-green-700 border border-green-300">
                Locked
              </Badge>
            )}
          </div>
        </td>
        <td className="hidden md:table-cell py-3 px-2">
          {new Date(item.createdAt).toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell py-3 px-2">
          {new Date(item.updatedAt).toLocaleDateString()}
        </td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Link to={`/production/formulations/${item.id}`} className="text-blue-500 hover:underline">
              <Button className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer group">
                <Eye />
              </Button>
            </Link>
            <FormModal table="FormulationsAndRnD" type="delete" id={item.id} data={item} />
          </div>
        </td>
      </tr>
    )
  };


  // Filter formulations by name locally
  const filteredFormulations = formulations.filter(f => 
    filters.name ? f.productName.toLowerCase().includes(filters.name.toLowerCase()) : true
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Formulations & R&D</h1>
          <p className="text-sm text-gray-500">Manage product formulations with version control</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={fetchFormulations}
            className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <FormModal table="FormulationsAndRnD" type="create" />
        </div>
      </div>

      <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

      <form className="relative w-full border border-gray-300 rounded-md p-4" onSubmit={handleSearch}>
        <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">Filters</span>
        <div className="flex gap-4 w-full flex-wrap">
          <input 
            type="text" 
            placeholder="Search by Formulation Name" 
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            name="name" 
            value={filters.name} 
            onChange={handleFilterChange} 
          />
          <select 
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="">All Formulations</option>
            <option value="locked">With Locked Versions</option>
          </select>
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2"
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-8">Loading formulations...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredFormulations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No formulations found</div>
      ) : (
        <Table columns={columns} data={filteredFormulations} renderRow={rowLoader} />
      )}
    </div>
  )
}

export default FormulationsAndRnD
