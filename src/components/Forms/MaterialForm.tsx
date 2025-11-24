import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Plus, Trash2, Upload } from 'lucide-react';

const PurchaseHistorySchema = z.object({
    supplierName: z.string().min(1, { message: "Supplier name is required" }),
    billNumber: z.string().min(1, { message: "Bill number is required" }),
    purchaseDate: z.string().min(1, { message: "Purchase date is required" }),
    purchasedQty: z.number().min(0.01, { message: "Quantity must be greater than 0" }),
    costPerUnit: z.number().min(0, { message: "Cost must be 0 or greater" }),
});

const MaterialSchema = z.object({
    name: z.string().min(2, { message: "Material name must be at least 2 characters" }),
    type: z.enum(["Raw", "Packaging", "Consumable"]),
    unit: z.string().min(1, { message: "Unit is required" }),
    currentStockQty: z.number().min(0, { message: "Stock quantity must be 0 or greater" }),
    minThresholdQty: z.number().min(0, { message: "Threshold must be 0 or greater" }),
    purchaseHistory: z.array(PurchaseHistorySchema).optional(),
});

type MaterialFormData = z.infer<typeof MaterialSchema>;

interface MaterialFormProps {
    type: "create" | "update";
    data?: any;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MaterialForm = ({ type, data, setOpen }: MaterialFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [billFile, setBillFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
    } = useForm<MaterialFormData>({
        resolver: zodResolver(MaterialSchema),
        defaultValues: {
            name: data?.name || "",
            type: data?.type || "Raw",
            unit: data?.unit || "kg",
            currentStockQty: data?.currentStockQty || 0,
            minThresholdQty: data?.minThresholdQty || 0,
            purchaseHistory: data?.purchaseHistory || (type === "create" ? [{
                supplierName: "",
                billNumber: "",
                purchaseDate: new Date().toISOString().split('T')[0],
                purchasedQty: 0,
                costPerUnit: 0,
            }] : []),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "purchaseHistory",
    });

    const onSubmit = handleSubmit(async (formData) => {
        try {
            setIsSubmitting(true);
            setApiError(null);

            if (type === "create") {
                const response = await api.post("/api/stock/materials", formData);
                console.log("Material created:", response.data);
                
                // Upload bill if provided
                if (billFile && response.data.material?.id && formData.purchaseHistory?.[0]?.billNumber) {
                    const formDataObj = new FormData();
                    formDataObj.append('bill', billFile);
                    formDataObj.append('billNumber', formData.purchaseHistory[0].billNumber);
                    
                    try {
                        await api.post(
                            `/api/stock/materials/${response.data.material.id}/upload-bill`,
                            formDataObj,
                            {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            }
                        );
                    } catch (uploadErr) {
                        console.error("Bill upload failed:", uploadErr);
                    }
                }
            } else {
                // For update, we need to use PATCH endpoint
                const updateData = {
                    name: formData.name,
                    type: formData.type,
                    unit: formData.unit,
                    minThresholdQty: formData.minThresholdQty,
                };
                const response = await api.patch(`/api/stock/materials/${data?.id}`, updateData);
                console.log("Material updated:", response.data);
            }

            setOpen(false);
            window.location.reload();
        } catch (err: any) {
            console.error("API Error:", err);
            setApiError(err.response?.data?.error || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBillFile(e.target.files[0]);
        }
    };

    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">
                {type === "create" ? "Add New Material" : "Update Material"}
            </h1>

            {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {apiError}
                </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Material Name *</label>
                    <input
                        {...register('name')}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        placeholder="e.g., Aloe Vera Extract"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Type *</label>
                    <select
                        {...register('type')}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    >
                        <option value="Raw">Raw Materials</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Consumable">Consumables</option>
                    </select>
                    {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Unit *</label>
                    <input
                        {...register('unit')}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        placeholder="e.g., kg, liters, pieces"
                    />
                    {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Current Stock Quantity *</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('currentStockQty', { valueAsNumber: true })}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        placeholder="0"
                        disabled={type === "update"}
                    />
                    {errors.currentStockQty && <p className="text-xs text-red-500">{errors.currentStockQty.message}</p>}
                    {type === "update" && (
                        <p className="text-xs text-gray-500">Use stock adjustment to change quantity</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Minimum Threshold *</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('minThresholdQty', { valueAsNumber: true })}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        placeholder="0"
                    />
                    {errors.minThresholdQty && <p className="text-xs text-red-500">{errors.minThresholdQty.message}</p>}
                </div>
            </div>

            {/* Purchase History (Only for Create) */}
            {type === "create" && (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-semibold">Purchase Details</h2>
                        <button
                            type="button"
                            onClick={() => append({
                                supplierName: "",
                                billNumber: "",
                                purchaseDate: new Date().toISOString().split('T')[0],
                                purchasedQty: 0,
                                costPerUnit: 0,
                            })}
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm"
                        >
                            <Plus size={16} />
                            Add Purchase
                        </button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-300 rounded-md p-4 relative">
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-gray-400">Supplier Name *</label>
                                    <input
                                        {...register(`purchaseHistory.${index}.supplierName`)}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                        placeholder="e.g., ABC Suppliers"
                                    />
                                    {errors.purchaseHistory?.[index]?.supplierName && (
                                        <p className="text-xs text-red-500">{errors.purchaseHistory[index]?.supplierName?.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-gray-400">Bill Number *</label>
                                    <input
                                        {...register(`purchaseHistory.${index}.billNumber`)}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                        placeholder="e.g., BILL-001"
                                    />
                                    {errors.purchaseHistory?.[index]?.billNumber && (
                                        <p className="text-xs text-red-500">{errors.purchaseHistory[index]?.billNumber?.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-gray-400">Purchase Date *</label>
                                    <input
                                        type="date"
                                        {...register(`purchaseHistory.${index}.purchaseDate`)}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                    />
                                    {errors.purchaseHistory?.[index]?.purchaseDate && (
                                        <p className="text-xs text-red-500">{errors.purchaseHistory[index]?.purchaseDate?.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-gray-400">Quantity Purchased *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`purchaseHistory.${index}.purchasedQty`, { valueAsNumber: true })}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                        placeholder="0"
                                    />
                                    {errors.purchaseHistory?.[index]?.purchasedQty && (
                                        <p className="text-xs text-red-500">{errors.purchaseHistory[index]?.purchasedQty?.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-gray-400">Cost Per Unit *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`purchaseHistory.${index}.costPerUnit`, { valueAsNumber: true })}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                        placeholder="0.00"
                                    />
                                    {errors.purchaseHistory?.[index]?.costPerUnit && (
                                        <p className="text-xs text-red-500">{errors.purchaseHistory[index]?.costPerUnit?.message}</p>
                                    )}
                                </div>

                                {/* File upload for first purchase only */}
                                {index === 0 && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs text-gray-400">Upload Bill (PDF/Image)</label>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                                                <Upload size={16} />
                                                <span className="text-sm">Choose File</span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            {billFile && (
                                                <span className="text-sm text-gray-600">{billFile.name}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white rounded-md p-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Processing..." : (type === "create" ? "Add Material" : "Update Material")}
            </button>
        </form>
    );
};

export default MaterialForm;

