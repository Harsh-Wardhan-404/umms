import { Download, Eye } from "lucide-react";
import { useState } from "react";
import FormModal from "../_components/FormModal";
import Table from "../_components/Table";
import { users } from "@/lib/constants";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

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
  const [filters, setFilters] = useState({
    name: "",
    category: "",
    status: ""
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

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
            <FormModal table="Staff" type="delete" id={item.id} />
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

      <form className="relative w-full border border-gray-300 rounded-md p-4">
        <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">Filters</span>
        <div className="flex gap-4 w-full flex-wrap">
          <input type="text" placeholder="Search by Staff Name" className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="name" value={filters.name} onChange={handleFilterChange} />
        </div>
      </form>
      <Table columns={columns} data={users} renderRow={rowLoader} />
    </div>
  )
}

export default Staff
