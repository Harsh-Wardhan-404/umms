import UserForm from "@/components/Forms/UserFrom";
import { Plus, SquarePen, Trash2, X } from "lucide-react";
import { useState, type JSX } from "react";

declare interface formDataProps {
    table:  "RawMaterial" | "Suppliers" | "FormulationsAndRnD" | "BatchProduction" | "Staff"
    type: "create" | "update" | "delete";
    data?: any;
    id?: string | number;
    relatedData?: any;
}

const forms: {
  [key: string]: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
    Staff: (setOpen, type, data, relatedData) => <UserForm setOpen={setOpen} type={type} data={data} relatedData={relatedData} />
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

        return type == "delete" && id ? (
            <form
                action=""
                className="p-4 flex flex-col gap-4"
            >
                <span className="text-center font-medium">
                    All data will be lost. Are you sure you want to delete this {table}?
                </span>
                <button className="bg-red-600 text-white py-2 px-4 rounded-md border-none w-max self-center">
                    Delete
                </button>
            </form>
        ) : (type == "create" || type == "update") ? (
            forms[table](setOpen, type, data, relatedData)
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
