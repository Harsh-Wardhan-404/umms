import { Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import FormModal from "../_components/FormModal";
import Table from "../_components/Table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import api from "@/lib/api";

const columns = [
  {
    header: "Staff Name",
    accessor: "staffName",
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden md:table-cell",
  },
  {
    header: "Role",
    accessor: "role",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const Staff = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    category: "",
    status: ""
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/users", {
        params: {
          search: filters.name || undefined,
          limit: 100,
        },
      });
      setUsers(response.data.users || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
    fetchUsers();
  };

  const handleDeleteSuccess = () => {
    fetchUsers(); // Refresh the list after deletion
  };

  const rowLoader = (item: User) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2">{item.firstName} {item.lastName}</td>
        <td className="py-3 hidden md:table-cell px-2">{item.email}</td>
        <td className="py-3 px-2">{item.role}</td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Link to={`/user/${item.id}`} className="text-blue-500 hover:underline">
              <Button className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer group">
                <Eye />
              </Button>
            </Link>
            <FormModal table="Staff" type="update" data={item} id={item.id} />
            <FormModal table="Staff" type="delete" id={item.id} data={item} />
          </div>
        </td>
      </tr>
    )
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Staff</h1>
          <p className="text-sm text-gray-500">Manage your staff here.</p>
        </div>
        <div className="flex gap-4 items-center">
          <FormModal table="Staff" type="create" />
          <button className="flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-1.5 gap-2">
            <Download />
            Import
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

      <form className="relative w-full border border-gray-300 rounded-md p-4" onSubmit={handleSearch}>
        <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">Filters</span>
        <div className="flex gap-4 w-full flex-wrap">
          <input 
            type="text" 
            placeholder="Search by Staff Name, Email, or Username" 
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            name="name" 
            value={filters.name} 
            onChange={handleFilterChange} 
          />
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2"
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No users found</div>
      ) : (
        <Table columns={columns} data={users} renderRow={rowLoader} />
      )}
    </div>
  )
}

export default Staff
