import UserForm from "@/components/Forms/UserFrom";
import MaterialForm from "@/components/Forms/MaterialForm";
import FormulationForm from "@/components/Forms/FormulationForm";
import FinishedGoodForm from "@/components/Forms/FinishedGoodForm";
import ClientForm from "@/components/Forms/ClientForm";
import DispatchForm from "@/components/Forms/DispatchForm";
import { Plus, SquarePen, Trash2, X } from "lucide-react";
import { useState, type JSX } from "react";
import Staff from "../Staff/Staff";
import api from "@/lib/api";

declare interface formDataProps {
    table:  "RawMaterial" | "Suppliers" | "FormulationsAndRnD" | "BatchProduction" | "Staff" | "FinishedGoods" | "Clients" | "Invoices" | "Dispatches" | "Profit & Loss Entry"
    type: "create" | "update" | "delete";
    data?: any;
    id?: string | number;
    relatedData?: any;
}

// Delete action map for different tables
const deleteActionMap: {
  [key: string]: (id: Number | String) => Promise<any>;
} = {
    Staff: async (id: Number | String) => {
        // API call to delete staff member
        const response = await api.delete(`/api/users/${id}`);
        return response.data;
    },
    RawMaterial: async (id: Number | String) => {
        // API call to delete material
        const response = await api.delete(`/api/stock/materials/${id}`);
        return response.data;
    },
    FormulationsAndRnD: async (id: Number | String) => {
        // API call to delete formulation
        const response = await api.delete(`/api/formulations/${id}`);
        return response.data;
    },
    BatchProduction: async (id: Number | String) => {
        // API call to delete batch
        const response = await api.delete(`/api/batches/${id}`);
        return response.data;
    },
    FinishedGoods: async (id: Number | String) => {
        // API call to delete finished good
        const response = await api.delete(`/api/finished-goods/${id}`);
        return response.data;
    },
    Clients: async (id: Number | String) => {
        // API call to deactivate client
        const response = await api.patch(`/api/clients/${id}`, { isActive: false });
        return response.data;
    },
    Invoices: async (id: Number | String) => {
        // API call to delete invoice
        const response = await api.delete(`/api/invoices/${id}`);
        return response.data;
    },
    Dispatches: async (id: Number | String) => {
        // API call to delete dispatch
        const response = await api.delete(`/api/dispatches/${id}`);
        return response.data;
    },
    "Profit & Loss Entry": async (id: Number | String) => {
        // API call to delete P&L entry
        const response = await api.delete(`/api/profit-loss/${id}`);
        return response.data;
    }
};

const forms: {
  [key: string]: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
    Staff: (setOpen, type, data, relatedData) => <UserForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />,
    RawMaterial: (setOpen, type, data, relatedData) => <MaterialForm setOpen={setOpen} type={type} data={data} />,
    FormulationsAndRnD: (setOpen, type, data, relatedData) => <FormulationForm setOpen={setOpen} type={type} />,
    FinishedGoods: (setOpen, type, data, relatedData) => <FinishedGoodForm setOpen={setOpen} type={type} data={data} />,
    Clients: (setOpen, type, data, relatedData) => <ClientForm setOpen={setOpen} type={type} data={data} />,
    Dispatches: (setOpen, type, data, relatedData) => <DispatchForm setOpen={setOpen} type={type} data={data} />
};

const FormModal = ({ table, type, data, id }: formDataProps) => {
    const [open, setOpen] = useState(false);
    const color = type == "create" ? "bg-green-300 border-1 border-green-500 !text-green-700 hover:bg-green-400" : type == "update" ? "bg-blue-300 border-1 border-blue-600 !text-blue-700 hover:bg-blue-400" : "bg-red-300 border-1 border-red-600 !text-red-700 hover:bg-red-400";
    const icon = type == "create" ? <Plus className="transition-transform duration-200 group-hover:rotate-[15deg]" /> : type == "update" ? <SquarePen className="transition-transform duration-200 group-hover:rotate-[15deg]" /> : <Trash2 className="transition-transform duration-200 group-hover:rotate-[15deg]" />;

    const relatedData = {}; // Fetch or pass any related data needed for the form from here command for cursor
    switch (table) {
        case "RawMaterial":
            // relatedData = useFormulationsAndRnDRelatedData();
            break;
        case "FormulationsAndRnD":
            // relatedData = useBatchProductionRelatedData();
            break;
        // Add more cases as needed for other tables
    }

    //Above switch is just a placeholder to show how related data can be fetched based on table type.

    const Form = () => {
        const [isDeleting, setIsDeleting] = useState(false);
        const [deleteError, setDeleteError] = useState<string | null>(null);

        const handleDelete = async (e: React.FormEvent) => {
            e.preventDefault();
            if (id && deleteActionMap[table]) {
                try {
                    setIsDeleting(true);
                    setDeleteError(null);
                    await deleteActionMap[table](id);
                    setOpen(false);
                    // Reload the page to refresh the list
                    window.location.reload();
                } catch (error: any) {
                    console.error("Error deleting:", error);
                    setDeleteError(error.response?.data?.error || "Failed to delete");
                }finally {
                    setIsDeleting(false);
                }
            }
        };

        return type == "delete" && id ? (
            <form
                action=""
                className="p-4 flex flex-col gap-4"
                onSubmit={handleDelete}
            >
                <span className="text-center font-medium">
                    All data will be lost. Are you sure you want to delete this {table}?
                </span>
                {deleteError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                        {deleteError}
                    </div>
                )}
                {data && (
                    <div className="text-sm text-gray-600 text-center">
                        {data.firstName && data.lastName ? (
                            <>{data.firstName} {data.lastName} ({data.email})</>
                        ) : data.productName ? (
                            <>{data.productName}</>
                        ) : data.batchCode ? (
                            <>Batch: {data.batchCode}</>
                        ) : data.invoiceNumber ? (
                            <>Invoice: {data.invoiceNumber}</>
                        ) : data.awbNumber ? (
                            <>Dispatch AWB: {data.awbNumber}</>
                        ) : data.name ? (
                            <>{data.name}</>
                        ) : null}
                    </div>
                )}
                <button 
                    type="submit"
                    disabled={isDeleting}
                    className="bg-red-600 text-white py-2 px-4 rounded-md border-none w-max self-center disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </button>
            </form>
        ) : (type == "create" || type == "update") ? (
            forms[table] ? forms[table](setOpen, type, data, relatedData) : (
                <div className="p-4 text-center">
                    <p className="text-gray-600">Form for "{table}" is not yet implemented.</p>
                    <p className="text-sm text-gray-500 mt-2">Please add the form component to the forms object.</p>
                </div>
            )
        ) : (
            "Form not found!"
        );
    };

    return (
        <>
            <button className={`flex justify-center items-center w-8 h-8 ${color} text-white rounded-md cursor-pointer group`} onClick={() => setOpen(true)}>
                {icon}
            </button>

            {open && (
                <div className="w-screen h-screen fixed top-0 left-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[30%] max-h-[90vh] my-auto">
                        <div
                            className="overflow-y-auto max-h-[calc(90vh-40px)] pr-2"
                            style={{ paddingTop: "10px" }}
                        >
                            <Form />
                        </div>
                        <div
                            className="absolute top-2 right-2 cursor-pointer z-10"
                            onClick={() => setOpen(false)}
                        >
                            <X />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default FormModal
