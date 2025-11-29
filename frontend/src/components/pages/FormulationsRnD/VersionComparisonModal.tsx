import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface Ingredient {
    materialId: string;
    materialName: string;
    materialType: string;
    percentageOrComposition: number;
    unit: string;
    notes?: string;
}

interface ComparisonData {
    version1: {
        versionNumber: number;
        creationDate: string;
        creatorName: string;
        notes?: string;
        isLocked: boolean;
        ingredients: Ingredient[];
    };
    version2: {
        versionNumber: number;
        creationDate: string;
        creatorName: string;
        notes?: string;
        isLocked: boolean;
        ingredients: Ingredient[];
    };
    changes: {
        added: Ingredient[];
        removed: Ingredient[];
        modified: Array<{
            materialName: string;
            materialType: string;
            oldValue: number;
            newValue: number;
            difference: number;
            unit: string;
        }>;
    };
}

interface Version {
    id: string;
    versionNumber: number;
    isLocked: boolean;
    creationDate: string;
}

interface VersionComparisonModalProps {
    formulationId: string;
    versions: Version[];
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const VersionComparisonModal = ({ formulationId, versions, setOpen }: VersionComparisonModalProps) => {
    const [version1, setVersion1] = useState<number>(versions[1]?.versionNumber || 1);
    const [version2, setVersion2] = useState<number>(versions[0]?.versionNumber || 2);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComparison = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/api/formulations/${formulationId}/compare`, {
                params: { version1, version2 }
            });
            setComparisonData(response.data);
        } catch (err: any) {
            console.error("Error fetching comparison:", err);
            setError(err.response?.data?.error || "Failed to fetch comparison");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (version1 && version2 && version1 !== version2) {
            fetchComparison();
        }
    }, [version1, version2]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Compare Versions</h2>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Version Selectors */}
                    <div className="flex items-center gap-4 justify-center">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold">Version 1</label>
                            <select
                                value={version1}
                                onChange={(e) => setVersion1(Number(e.target.value))}
                                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm min-w-[150px]"
                            >
                                {versions.map((v) => (
                                    <option key={v.id} value={v.versionNumber}>
                                        Version {v.versionNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <ArrowRight className="mt-6" size={24} />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold">Version 2</label>
                            <select
                                value={version2}
                                onChange={(e) => setVersion2(Number(e.target.value))}
                                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm min-w-[150px]"
                            >
                                {versions.map((v) => (
                                    <option key={v.id} value={v.versionNumber}>
                                        Version {v.versionNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Loading comparison...
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-500">
                            {error}
                        </div>
                    )}

                    {comparisonData && !loading && !error && (
                        <>
                            {/* Version Headers */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-gray-300 rounded-lg p-4 bg-blue-50">
                                    <h3 className="font-bold mb-2 flex items-center gap-2">
                                        Version {comparisonData.version1.versionNumber}
                                        {comparisonData.version1.isLocked && (
                                            <Badge className="bg-green-100 text-green-700 border border-green-300">
                                                Locked
                                            </Badge>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Created: {new Date(comparisonData.version1.creationDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        By: {comparisonData.version1.creatorName}
                                    </p>
                                    {comparisonData.version1.notes && (
                                        <p className="text-sm text-gray-700 mt-2 italic">
                                            "{comparisonData.version1.notes}"
                                        </p>
                                    )}
                                </div>

                                <div className="border border-gray-300 rounded-lg p-4 bg-purple-50">
                                    <h3 className="font-bold mb-2 flex items-center gap-2">
                                        Version {comparisonData.version2.versionNumber}
                                        {comparisonData.version2.isLocked && (
                                            <Badge className="bg-green-100 text-green-700 border border-green-300">
                                                Locked
                                            </Badge>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Created: {new Date(comparisonData.version2.creationDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        By: {comparisonData.version2.creatorName}
                                    </p>
                                    {comparisonData.version2.notes && (
                                        <p className="text-sm text-gray-700 mt-2 italic">
                                            "{comparisonData.version2.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Changes Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-700 mb-2">Added Ingredients</h4>
                                    <p className="text-2xl font-bold text-green-700">
                                        {comparisonData.changes.added.length}
                                    </p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-700 mb-2">Removed Ingredients</h4>
                                    <p className="text-2xl font-bold text-red-700">
                                        {comparisonData.changes.removed.length}
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-700 mb-2">Modified Ingredients</h4>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {comparisonData.changes.modified.length}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Changes */}
                            {comparisonData.changes.added.length > 0 && (
                                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                                    <h4 className="font-semibold text-green-700 mb-3">Added Ingredients</h4>
                                    <div className="space-y-2">
                                        {comparisonData.changes.added.map((ingredient, index) => (
                                            <div key={index} className="bg-white p-3 rounded border border-green-200">
                                                <p className="font-medium">{ingredient.materialName}</p>
                                                <p className="text-sm text-gray-600">
                                                    <Badge variant="outline" className="mr-2">{ingredient.materialType}</Badge>
                                                    {ingredient.percentageOrComposition.toFixed(2)} {ingredient.unit}
                                                </p>
                                                {ingredient.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">{ingredient.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {comparisonData.changes.removed.length > 0 && (
                                <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                                    <h4 className="font-semibold text-red-700 mb-3">Removed Ingredients</h4>
                                    <div className="space-y-2">
                                        {comparisonData.changes.removed.map((ingredient, index) => (
                                            <div key={index} className="bg-white p-3 rounded border border-red-200">
                                                <p className="font-medium">{ingredient.materialName}</p>
                                                <p className="text-sm text-gray-600">
                                                    <Badge variant="outline" className="mr-2">{ingredient.materialType}</Badge>
                                                    {ingredient.percentageOrComposition.toFixed(2)} {ingredient.unit}
                                                </p>
                                                {ingredient.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">{ingredient.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {comparisonData.changes.modified.length > 0 && (
                                <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                                    <h4 className="font-semibold text-blue-700 mb-3">Modified Ingredients</h4>
                                    <div className="space-y-2">
                                        {comparisonData.changes.modified.map((change, index) => (
                                            <div key={index} className="bg-white p-3 rounded border border-blue-200">
                                                <p className="font-medium">{change.materialName}</p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <Badge variant="outline">{change.materialType}</Badge>
                                                </p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-500">
                                                        {change.oldValue.toFixed(2)} {change.unit}
                                                    </span>
                                                    <ArrowRight size={16} className="text-blue-600" />
                                                    <span className="font-semibold text-blue-700">
                                                        {change.newValue.toFixed(2)} {change.unit}
                                                    </span>
                                                    <span className={`ml-2 ${
                                                        change.difference > 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        ({change.difference > 0 ? '+' : ''}{change.difference.toFixed(2)} {change.unit})
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {comparisonData.changes.added.length === 0 && 
                             comparisonData.changes.removed.length === 0 && 
                             comparisonData.changes.modified.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No differences found between these versions
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VersionComparisonModal;

