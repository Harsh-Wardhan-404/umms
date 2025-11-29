import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const IngredientSchema = z.object({
    materialId: z.string().min(1, { message: "Material is required" }),
    percentageOrComposition: z.number().min(0, { message: "Must be 0 or greater" }),
    unit: z.string().min(1, { message: "Unit is required" }),
    notes: z.string().optional(),
});

const VersionSchema = z.object({
    ingredients: z.array(IngredientSchema).min(1, { message: "At least one ingredient is required" }),
    notes: z.string().optional(),
});

type VersionFormData = z.infer<typeof VersionSchema>;

interface Material {
    id: string;
    name: string;
    unit: string;
    type: string;
}

interface VersionModalProps {
    formulationId: string;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onSuccess: () => void;
}

const VersionModal = ({ formulationId, setOpen, onSuccess }: VersionModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const { user } = useAuth();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
    } = useForm<VersionFormData>({
        resolver: zodResolver(VersionSchema),
        defaultValues: {
            ingredients: [{
                materialId: "",
                percentageOrComposition: 0,
                unit: "%",
                notes: "",
            }],
            notes: "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "ingredients",
    });

    // Fetch materials for dropdown
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await api.get("/api/stock/materials");
                setMaterials(response.data.materials || []);
            } catch (error) {
                console.error("Error fetching materials:", error);
            } finally {
                setLoadingMaterials(false);
            }
        };
        fetchMaterials();
    }, []);

    // Calculate total percentage
    const ingredients = watch("ingredients");
    const totalPercentage = ingredients.reduce((sum, ing) => 
        sum + (parseFloat(String(ing.percentageOrComposition)) || 0), 0
    );

    const onSubmit = handleSubmit(async (formData) => {
        try {
            setIsSubmitting(true);
            setApiError(null);

            // Add creatorId from logged-in user
            const requestData = {
                ...formData,
                creatorId: user?.id,
            };

            await api.post(`/api/formulations/${formulationId}/versions`, requestData);
            onSuccess();
            setOpen(false);
        } catch (err: any) {
            console.error("API Error:", err);
            setApiError(err.response?.data?.error || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create New Version</h2>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form className="p-6 flex flex-col gap-6" onSubmit={onSubmit}>
                    {apiError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {apiError}
                        </div>
                    )}

                    {/* Version Notes */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">Version Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                            placeholder="e.g., Increased active ingredient concentration for better efficacy"
                            rows={3}
                        />
                    </div>

                    {/* Ingredients Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold">Ingredients</h3>
                            <button
                                type="button"
                                onClick={() => append({
                                    materialId: "",
                                    percentageOrComposition: 0,
                                    unit: "%",
                                    notes: "",
                                })}
                                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm"
                            >
                                <Plus size={16} />
                                Add Ingredient
                            </button>
                        </div>

                        {/* Total Percentage Indicator */}
                        <div className={`p-3 rounded-md ${
                            totalPercentage === 100 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                            <p className="text-sm">
                                <span className="font-semibold">Total Composition: </span>
                                <span className={totalPercentage === 100 ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                                    {totalPercentage.toFixed(2)}%
                                </span>
                            </p>
                            {totalPercentage !== 100 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    Note: Total should equal 100% for accurate formulation
                                </p>
                            )}
                        </div>

                        {/* Ingredient Fields */}
                        {loadingMaterials ? (
                            <p className="text-sm text-gray-500">Loading materials...</p>
                        ) : (
                            fields.map((field, index) => (
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
                                        {/* Material Selection */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-gray-400">Material *</label>
                                            <select
                                                {...register(`ingredients.${index}.materialId`)}
                                                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                            >
                                                <option value="">Select material...</option>
                                                {materials.map((material) => (
                                                    <option key={material.id} value={material.id}>
                                                        {material.name} ({material.type})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.ingredients?.[index]?.materialId && (
                                                <p className="text-xs text-red-500">
                                                    {errors.ingredients[index]?.materialId?.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Percentage */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-gray-400">Percentage/Composition *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`ingredients.${index}.percentageOrComposition`, { 
                                                        valueAsNumber: true 
                                                    })}
                                                    className="flex-1 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                                                    placeholder="0.00"
                                                />
                                                <input
                                                    {...register(`ingredients.${index}.unit`)}
                                                    className="w-20 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                                                    placeholder="%"
                                                />
                                            </div>
                                            {errors.ingredients?.[index]?.percentageOrComposition && (
                                                <p className="text-xs text-red-500">
                                                    {errors.ingredients[index]?.percentageOrComposition?.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-xs text-gray-400">Notes (Optional)</label>
                                            <textarea
                                                {...register(`ingredients.${index}.notes`)}
                                                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                                placeholder="Add notes about this ingredient..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {errors.ingredients?.root && (
                        <p className="text-xs text-red-500">{errors.ingredients.root.message}</p>
                    )}

                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="border border-gray-300 text-gray-700 rounded-md px-6 py-2 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || loadingMaterials}
                            className="bg-blue-500 text-white rounded-md px-6 py-2 disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-600"
                        >
                            {isSubmitting ? "Creating..." : "Create Version"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VersionModal;

