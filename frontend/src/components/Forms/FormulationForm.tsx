import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const IngredientSchema = z.object({
    materialId: z.string().min(1, { message: "Material is required" }),
    percentageOrComposition: z.number().min(0, { message: "Must be 0 or greater" }),
    unit: z.string().min(1, { message: "Unit is required" }),
    notes: z.string().optional(),
});

const FormulationSchema = z.object({
    productName: z.string().min(2, { message: "Product name must be at least 2 characters" }),
    initialIngredients: z.array(IngredientSchema).min(1, { message: "At least one ingredient is required" }),
});

type FormulationFormData = z.infer<typeof FormulationSchema>;

interface Material {
    id: string;
    name: string;
    unit: string;
    type: string;
}

interface FormulationFormProps {
    type: "create";
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const FormulationForm = ({ type, setOpen }: FormulationFormProps) => {
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
    } = useForm<FormulationFormData>({
        resolver: zodResolver(FormulationSchema),
        defaultValues: {
            productName: "",
            initialIngredients: [{
                materialId: "",
                percentageOrComposition: 0,
                unit: "%",
                notes: "",
            }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "initialIngredients",
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
    const ingredients = watch("initialIngredients");
    const totalPercentage = ingredients.reduce((sum, ing) => 
        sum + (parseFloat(String(ing.percentageOrComposition)) || 0), 0
    );

    const onSubmit = handleSubmit(async (formData) => {
        try {
            setIsSubmitting(true);
            setApiError(null);

            // Validate total composition equals 100%
            const total = formData.initialIngredients.reduce(
                (sum, ing) => sum + (parseFloat(String(ing.percentageOrComposition)) || 0),
                0
            );
            if (Math.abs(total - 100) > 0.01) {
                setApiError(`Total composition must equal 100%. Current total: ${total.toFixed(2)}%`);
                setIsSubmitting(false);
                return;
            }

            // Add creatorId from logged-in user
            const requestData = {
                ...formData,
                creatorId: user?.id,
            };

            const response = await api.post("/api/formulations", requestData);
            console.log("Formulation created:", response.data);

            setOpen(false);
            window.location.reload();
        } catch (err: any) {
            console.error("API Error:", err);
            setApiError(err.response?.data?.error || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">Create New Formulation</h1>

            {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {apiError}
                </div>
            )}

            {/* Product Name */}
            <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">Product Name *</label>
                <input
                    {...register('productName')}
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    placeholder="e.g., Herbal Face Cream"
                />
                {errors.productName && <p className="text-xs text-red-500">{errors.productName.message}</p>}
            </div>

            {/* Ingredients Section */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold">Ingredients (Version 1)</h2>
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
                            ⚠️ Total must equal 100% to create formulation. Please adjust the composition values.
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
                                        {...register(`initialIngredients.${index}.materialId`)}
                                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                    >
                                        <option value="">Select material...</option>
                                        {materials.map((material) => (
                                            <option key={material.id} value={material.id}>
                                                {material.name} ({material.type})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.initialIngredients?.[index]?.materialId && (
                                        <p className="text-xs text-red-500">
                                            {errors.initialIngredients[index]?.materialId?.message}
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
                                            {...register(`initialIngredients.${index}.percentageOrComposition`, { 
                                                valueAsNumber: true 
                                            })}
                                            className="flex-1 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                                            placeholder="0.00"
                                        />
                                        <input
                                            {...register(`initialIngredients.${index}.unit`)}
                                            className="w-20 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                                            placeholder="%"
                                        />
                                    </div>
                                    {errors.initialIngredients?.[index]?.percentageOrComposition && (
                                        <p className="text-xs text-red-500">
                                            {errors.initialIngredients[index]?.percentageOrComposition?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-xs text-gray-400">Notes (Optional)</label>
                                    <textarea
                                        {...register(`initialIngredients.${index}.notes`)}
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

            {errors.initialIngredients?.root && (
                <p className="text-xs text-red-500">{errors.initialIngredients.root.message}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting || loadingMaterials}
                className="bg-blue-500 text-white rounded-md p-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Creating..." : "Create Formulation"}
            </button>
        </form>
    );
};

export default FormulationForm;

