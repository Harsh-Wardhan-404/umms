import { Download, Plus, RefreshCw, AlertTriangle, PackagePlus } from "lucide-react"
import FormModal from "../_components/FormModal"
import { useState, useEffect } from "react";
import Table from "../_components/Table";
import type { StockManagement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { categoryBadgeStyles } from "@/lib/utils";
import clsx from "clsx";
import api from "@/lib/api";
import StockUpdateModal from "./StockUpdateModal";

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
    const [materials, setMaterials] = useState<StockManagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [stockUpdateModal, setStockUpdateModal] = useState<{
        isOpen: boolean;
        material: StockManagement | null;
    }>({ isOpen: false, material: null });
    const [filters, setFilters] = useState({
        name: "",
        category: "",
        status: ""
    });

    // Fetch materials from backend
    const fetchMaterials = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params: any = {};
            if (filters.name) params.search = filters.name;
            if (filters.category) params.type = filters.category;
            if (filters.status === "lowStock") params.lowStock = true;

            const response = await api.get("/api/stock/materials", { params });
            setMaterials(response.data.materials || []);
            setLowStockCount(response.data.lowStockCount || 0);
        } catch (err: any) {
            console.error("Error fetching materials:", err);
            setError(err.response?.data?.error || "Failed to fetch materials");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMaterials();
    };

    const rowLoader = (item: StockManagement) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 dark:even:bg-slate-700"
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
                    <button
                        onClick={() => setStockUpdateModal({ isOpen: true, material: item })}
                        className="flex justify-center items-center w-8 h-8 bg-purple-300 border-1 border-purple-500 !text-purple-700 hover:bg-purple-400 rounded-md cursor-pointer group"
                        title="Update Stock"
                    >
                        <PackagePlus size={16} />
                    </button>
                    <FormModal table="RawMaterial" type="update" data={item} />
                    <FormModal table="RawMaterial" type="delete" id={item.id} data={item} />
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
                    <h1 className="text-xl font-semibold">Inventory Management</h1>
                    <p className="text-sm text-gray-500">Manage raw materials, packaging, and consumables</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={fetchMaterials}
                        className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white rounded-md px-4 py-1.5 gap-2"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <FormModal table="RawMaterial" type="create" />
                </div>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
                    <AlertTriangle className="text-red-500" size={24} />
                    <div>
                        <p className="font-semibold text-red-800">Low Stock Alert!</p>
                        <p className="text-sm text-red-600">
                            {lowStockCount} material{lowStockCount > 1 ? 's are' : ' is'} running low on stock
                        </p>
                    </div>
                </div>
            )}

            <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

            <form className="relative w-full border border-gray-300 rounded-md p-4" onSubmit={handleSearch}>
                <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">Filters</span>
                <div className="flex gap-4 w-full flex-wrap">
                    <input 
                        type="text" 
                        placeholder="Search by Material Name" 
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        name="name" 
                        value={filters.name} 
                        onChange={handleFilterChange} 
                    />
                    <select 
                        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        name="category" 
                        value={filters.category} 
                        onChange={handleFilterChange}
                    >
                        <option value="">All Categories</option>
                        <option value="Raw">Raw Materials</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Consumable">Consumables</option>
                    </select>
                    <select 
                        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        name="status" 
                        value={filters.status} 
                        onChange={handleFilterChange}
                    >
                        <option value="">All Status</option>
                        <option value="lowStock">Low Stock Only</option>
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
                <div className="text-center py-8">Loading materials...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
            ) : materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No materials found</div>
            ) : (
                <Table columns={columns} data={materials} renderRow={rowLoader} />
            )}

            {/* Stock Update Modal */}
            {stockUpdateModal.material && (
                <StockUpdateModal
                    isOpen={stockUpdateModal.isOpen}
                    materialId={stockUpdateModal.material.id}
                    materialName={stockUpdateModal.material.name}
                    currentStock={stockUpdateModal.material.currentStockQty}
                    unit={stockUpdateModal.material.unit}
                    onClose={() => setStockUpdateModal({ isOpen: false, material: null })}
                    onSuccess={() => fetchMaterials()}
                />
            )}
        </div>
    )
}


export default RawMaterial
