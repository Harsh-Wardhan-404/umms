import { Download } from "lucide-react"
import FormModal from "../_components/FormModal"
import { useState } from "react";
import Table from "../_components/Table";
import type { StockManagement } from "@/lib/types";
import { medicines } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { categoryBadgeStyles } from "@/lib/utils";
import clsx from "clsx";

const columns = [
    {
        header: "Material Name",
        accessor: "materialName",
    },
    {
        header: "Category",
        accessor: "category",
        className: "hidden md:table-cell",
    },
    {
        header: "Current Stock",
        accessor: "currentStock",
        className: "hidden md:table-cell",
    },
    {
        header: "Min. Threshold",
        accessor: "minThreshold",
        className: "hidden xl:table-cell",
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

const getCategoryBadgeStyle = (category: string) => {
    const style = categoryBadgeStyles[category as keyof typeof categoryBadgeStyles]

    return (
        <Badge className={clsx("py-1", style)}>
            {category}
        </Badge>
    )
}

const RawMaterial = () => {
    const [filters, setFilters] = useState({
        name: "",
        category: "",
        status: ""
    });

    const rowLoader = (item: StockManagement) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50"
        >
            <td className="py-3 px-2">{item.name}</td>
            <td className="hidden md:table-cell py-3 px-2">{getCategoryBadgeStyle(item.type)}</td>
            <td className="hidden md:table-cell py-3 px-2">
                {item.currentStockQty} {item.unit}
            </td>
            <td className="hidden xl:table-cell py-3 px-2">
                {item.minThresholdQty} {item.unit}
            </td>
            <td className="py-3 px-2">
                {item.currentStockQty <= item.minThresholdQty ? (
                    <Badge className="bg-red-200 border-1 border-red-500 text-red-500">Low Stock</Badge>
                ) : (
                    <Badge className="bg-green-200 border-1 border-green-500 text-green-500 min-w-[73px]">In Stock</Badge>
                )}
            </td>
            <td className="py-3 px-2">
                <div className="flex gap-2">
                    <FormModal table="RawMaterial" type="update" data={item} />
                    <FormModal table="RawMaterial" type="delete" id={item.id} />
                </div>
            </td>
        </tr>
    );

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    }


    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-semibold">Raw Material</h1>
                    <p className="text-sm text-gray-500">Manage your raw materials here.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <FormModal table="RawMaterial" type="create" />
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
                    <input type="text" placeholder="Search by Material Name" className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="name" value={filters.name} onChange={handleFilterChange} />
                    <select className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="">All Categories</option>
                    </select>
                    <select className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="">All Status</option>
                    </select>
                </div>
            </form>
            <Table columns={columns} data={medicines} renderRow={rowLoader} />
        </div>
    )
}


export default RawMaterial
