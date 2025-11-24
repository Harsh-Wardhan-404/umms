import { Download } from "lucide-react"
import FormModal from "../_components/FormModal"
import { useState } from "react";
import type { FormulationVersion } from "@/lib/types";
import Table from "../_components/Table";
import { useParams } from "react-router-dom";

const columns = [
    {
        header: "Version Number",
        accessor: "versionNumber",
    },
    {
        header: "Creator",
        accessor: "creator",
    },
    {
        header: "Created at",
        accessor: "createdAt",
        className: "hidden md:table-cell",
    },
    {
        header: "is Locked",
        accessor: "isLocked",
        className: "hidden md:table-cell",
    },
    {
        header: "Actions",
        accessor: "actions",
    },
];

const formulation = {
  id: "form_001",
  productName: "Herbal Anti-Dandruff Shampoo",
  createdAt: new Date("2025-01-10T09:00:00Z"),
  updatedAt: new Date("2025-11-20T16:30:00Z"),

  versions: [
    {
      id: "form_ver_001",
      formulationId: "form_001",
      versionNumber: 1.0,
      isLocked: true,
      creatorId: "usr_001",
      creationDate: new Date("2025-02-10T09:30:00Z"),
      notes: "Initial formula tested successfully with mild fragrance.",

      // Linked User (Creator)
      creator: {
        id: "usr_001",
        username: "akhilesh_t",
        email: "akhilesh@example.com",
        firstName: "Akhilesh",
        lastName: "Talekar",
        role: "SUPERVISOR",
        passwordHash: "$2b$10$abcdefghi1234567890",
        createdAt: new Date("2024-10-15T09:30:00Z"),
        updatedAt: new Date("2025-11-20T18:00:00Z"),
      },

      // Ingredients
      ingredients: [
        {
          id: "ing_001",
          formulationVersionId: "form_ver_001",
          materialId: "mat_001",
          percentageOrComposition: 20,
          unit: "%",
          notes: "Base moisturizing extract",
          material: {
            id: "mat_001",
            materialName: "Aloe Vera Extract",
            category: "Botanical",
            availableQty: 120,
            unit: "L",
            reorderLevel: 20,
            supplier: "GreenLeaf Naturals Pvt Ltd",
            lastRestocked: new Date("2025-06-10T10:00:00Z"),
          },
        },
        {
          id: "ing_002",
          formulationVersionId: "form_ver_001",
          materialId: "mat_002",
          percentageOrComposition: 10,
          unit: "%",
          notes: "Antibacterial and scalp protection",
          material: {
            id: "mat_002",
            materialName: "Neem Oil",
            category: "Essential Oil",
            availableQty: 80,
            unit: "L",
            reorderLevel: 15,
            supplier: "Ayurveda Supplies Co.",
            lastRestocked: new Date("2025-06-05T14:00:00Z"),
          },
        },
        {
          id: "ing_003",
          formulationVersionId: "form_ver_001",
          materialId: "mat_003",
          percentageOrComposition: 65,
          unit: "%",
          notes: "Solvent base for all active ingredients",
          material: {
            id: "mat_003",
            materialName: "Purified Water",
            category: "Solvent",
            availableQty: 5000,
            unit: "L",
            reorderLevel: 1000,
            supplier: "HydraPure Industries",
            lastRestocked: new Date("2025-06-01T08:30:00Z"),
          },
        },
        {
          id: "ing_004",
          formulationVersionId: "form_ver_001",
          materialId: "mat_004",
          percentageOrComposition: 5,
          unit: "%",
          notes: "Fragrance additive",
          material: {
            id: "mat_004",
            materialName: "Lemon Grass Fragrance Oil",
            category: "Additive",
            availableQty: 40,
            unit: "L",
            reorderLevel: 10,
            supplier: "AromaEssence Pvt Ltd",
            lastRestocked: new Date("2025-06-15T12:00:00Z"),
          },
        },
      ],
    },
    {
      id: "form_ver_002",
      formulationId: "form_001",
      versionNumber: 2.0,
      isLocked: false,
      creatorId: "usr_001",
      creationDate: new Date("2025-07-20T10:00:00Z"),
      notes: "Enhanced version with coconut oil and smoother finish.",

      creator: {
        id: "usr_001",
        username: "akhilesh_t",
        email: "akhilesh@example.com",
        firstName: "Akhilesh",
        lastName: "Talekar",
        role: "SUPERVISOR",
        passwordHash: "$2b$10$abcdefghi1234567890",
        createdAt: new Date("2024-10-15T09:30:00Z"),
        updatedAt: new Date("2025-11-20T18:00:00Z"),
      },

      ingredients: [
        {
          id: "ing_005",
          formulationVersionId: "form_ver_002",
          materialId: "mat_005",
          percentageOrComposition: 15,
          unit: "%",
          notes: "Improves hair smoothness and moisture",
          material: {
            id: "mat_005",
            materialName: "Coconut Oil",
            category: "Natural Oil",
            availableQty: 200,
            unit: "L",
            reorderLevel: 30,
            supplier: "Pure Tropics Ltd",
            lastRestocked: new Date("2025-07-10T11:00:00Z"),
          },
        },
        {
          id: "ing_006",
          formulationVersionId: "form_ver_002",
          materialId: "mat_001",
          percentageOrComposition: 18,
          unit: "%",
          notes: "Maintains scalp hydration",
          material: {
            id: "mat_001",
            materialName: "Aloe Vera Extract",
            category: "Botanical",
            availableQty: 120,
            unit: "L",
            reorderLevel: 20,
            supplier: "GreenLeaf Naturals Pvt Ltd",
            lastRestocked: new Date("2025-06-10T10:00:00Z"),
          },
        },
        {
          id: "ing_007",
          formulationVersionId: "form_ver_002",
          materialId: "mat_003",
          percentageOrComposition: 60,
          unit: "%",
          notes: "Solvent and base",
          material: {
            id: "mat_003",
            materialName: "Purified Water",
            category: "Solvent",
            availableQty: 5000,
            unit: "L",
            reorderLevel: 1000,
            supplier: "HydraPure Industries",
            lastRestocked: new Date("2025-06-01T08:30:00Z"),
          },
        },
        {
          id: "ing_008",
          formulationVersionId: "form_ver_002",
          materialId: "mat_004",
          percentageOrComposition: 7,
          unit: "%",
          notes: "Improved fragrance",
          material: {
            id: "mat_004",
            materialName: "Lemon Grass Fragrance Oil",
            category: "Additive",
            availableQty: 40,
            unit: "L",
            reorderLevel: 10,
            supplier: "AromaEssence Pvt Ltd",
            lastRestocked: new Date("2025-06-15T12:00:00Z"),
          },
        },
      ],
    },
  ],
};


const OneFormulationDetails = () => {
    const {id} = useParams();
    const [filters, setFilters] = useState({
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

    const rowLoader = (item: FormulationVersion) => {
        return (
            <tr
                key={item.id}
                className="border-b border-gray-200 hover:bg-lamaPurpleLight even:bg-slate-50 dark:even:bg-slate-700"
            >
                <td className="py-3 px-2">{item.versionNumber}</td>
                <td className="py-3 px-2">{item.creator?.firstName} {item.creator?.lastName}</td>
                <td className="hidden md:table-cell py-3 px-2">{item.creationDate.toLocaleDateString()}</td>
                <td className="hidden md:table-cell py-3 px-2">{item.isLocked ? "Yes" : "-"}</td>
                <td className="py-3 px-2">
                    <FormModal table="RawMaterial" type="delete" id={item.id} />
                </td>
            </tr>
        )
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-semibold">Formulation Detail of {formulation.productName}</h1>
                    <p className="text-sm text-gray-500">See the details of the selected formulation.</p>
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

            <form className="relative w-fit border border-gray-300 rounded-md p-4">
                <span className="absolute -top-4 text-gray-500 text-lg px-1 tracking-wide bg-slate-100 dark:bg-[#282C35]">Filters</span>
                <div className="flex gap-4 w-full flex-wrap">
                    <select className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="">Select Sort</option>
                        <option value="name-asc">Version (A-Z)</option>
                        <option value="name-desc">Version (Z-A)</option>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="date-desc">Date (Newest First)</option>
                    </select>
                </div>
            </form>
            <Table columns={columns} data={formulation.versions} renderRow={rowLoader} />
        </div>
    )
}

export default OneFormulationDetails
