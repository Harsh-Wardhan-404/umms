import { Download, Eye } from "lucide-react";
import { useState } from "react";
import FormModal from "../_components/FormModal";
import Table from "../_components/Table";
import { formulations } from "@/lib/constants";
import type { Formulation } from "@/lib/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  const rowLoader = (item: Formulation) => {
    const latestVersion = item.versions?.[item.versions.length - 1];
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
      >
        <td className="py-3 px-2">{item.productName}</td>
        <td className="py-3 px-2">{latestVersion?.versionNumber}</td>
        <td className="hidden md:table-cell py-3 px-2">{item.createdAt.toLocaleDateString()}</td>
        <td className="hidden md:table-cell py-3 px-2">{item.updatedAt.toLocaleDateString()}</td>
        <td className="py-3 px-2">
          <div className="flex gap-2">
            <Link to={`/production/formulations/${item.id}`} className="text-blue-500 hover:underline">
              <Button className="flex justify-center items-center w-8 h-8 bg-blue-300 border-1 border-blue-500 !text-blue-700 hover:bg-blue-400 rounded-md cursor-pointer group">
                <Eye />
              </Button>
            </Link>
            <FormModal table="RawMaterial" type="delete" id={item.id} />
          </div>
        </td>
      </tr>
    )
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Raw Material</h1>
          <p className="text-sm text-gray-500">Manage your raw materials here.</p>
        </div>
        <div className="flex gap-4 items-center">
          <FormModal table="FormulationsAndRnD" type="create" />
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
          <input type="text" placeholder="Search by Formulation Name" className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="name" value={filters.name} onChange={handleFilterChange} />
          <select className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All Categories</option>
          </select>
          <select className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
          </select>
        </div>
      </form>
      <Table columns={columns} data={formulations} renderRow={rowLoader} />
    </div>
  )
}

export default FormulationsAndRnD
