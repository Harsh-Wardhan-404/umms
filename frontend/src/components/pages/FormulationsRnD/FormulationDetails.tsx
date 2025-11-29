import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Plus, GitCompare, History, User, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VersionModal from './VersionModal';
import VersionComparisonModal from './VersionComparisonModal';

interface Ingredient {
    id: string;
    materialId: string;
    percentageOrComposition: number;
    unit: string;
    notes?: string;
    material: {
        id: string;
        name: string;
        type: string;
        unit: string;
    };
}

interface Version {
    id: string;
    versionNumber: number;
    isLocked: boolean;
    creatorId: string;
    creationDate: string;
    notes?: string;
    ingredients: Ingredient[];
    creator?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface Formulation {
    id: string;
    productName: string;
    versions: Version[];
    createdAt: string;
    updatedAt: string;
}

const FormulationDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [formulation, setFormulation] = useState<Formulation | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchFormulation = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/api/formulations/${id}`);
            const data = response.data.formulation;
            setFormulation(data);
            // Select latest version by default
            if (data.versions && data.versions.length > 0) {
                setSelectedVersion(data.versions[0]);
            }
        } catch (err: any) {
            console.error("Error fetching formulation:", err);
            setError(err.response?.data?.error || "Failed to fetch formulation");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchFormulation();
        }
    }, [id]);

    const handleLockToggle = async (version: Version) => {
        try {
            setActionLoading(`lock-${version.id}`);
            await api.patch(`/api/formulations/${id}/versions/${version.versionNumber}/lock`, {
                isLocked: !version.isLocked,
                notes: !version.isLocked ? "Version locked for production" : "Version unlocked for editing"
            });
            await fetchFormulation();
        } catch (err: any) {
            console.error("Error toggling lock:", err);
            alert(err.response?.data?.error || "Failed to toggle lock status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRollback = async (version: Version) => {
        if (!confirm(`Are you sure you want to rollback to Version ${version.versionNumber}? This will create a new version based on this one.`)) {
            return;
        }

        try {
            setActionLoading(`rollback-${version.id}`);
            await api.post(`/api/formulations/${id}/rollback`, {
                targetVersionNumber: version.versionNumber,
                notes: `Rolled back to Version ${version.versionNumber}`
            });
            await fetchFormulation();
            alert("Formulation rolled back successfully!");
        } catch (err: any) {
            console.error("Error rolling back:", err);
            alert(err.response?.data?.error || "Failed to rollback version");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-gray-500">Loading formulation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    if (!formulation) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-gray-500">Formulation not found</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const totalComposition = selectedVersion?.ingredients.reduce(
        (sum, ing) => sum + ing.percentageOrComposition, 0
    ) || 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{formulation.productName}</h1>
                        <p className="text-sm text-gray-500">
                            Created: {new Date(formulation.createdAt).toLocaleDateString()} | 
                            Updated: {new Date(formulation.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {formulation.versions.length >= 2 && (
                        <Button
                            onClick={() => setShowComparisonModal(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <GitCompare size={16} />
                            Compare Versions
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowVersionModal(true)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                    >
                        <Plus size={16} />
                        New Version
                    </Button>
                </div>
            </div>

            <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Version Timeline & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Version List */}
                <div className="lg:col-span-1">
                    <div className="border border-gray-300 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <History size={18} />
                            Version History
                        </h2>
                        <div className="space-y-3">
                            {formulation.versions.map((version) => (
                                <div
                                    key={version.id}
                                    onClick={() => setSelectedVersion(version)}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                        selectedVersion?.id === version.id
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-sm">
                                            Version {version.versionNumber}
                                        </div>
                                        {version.isLocked ? (
                                            <Badge className="bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                                                <Lock size={12} />
                                                Locked
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Unlock size={12} />
                                                Unlocked
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        {new Date(version.creationDate).toLocaleDateString()}
                                    </p>
                                    {version.notes && (
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{version.notes}</p>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLockToggle(version);
                                            }}
                                            disabled={actionLoading === `lock-${version.id}`}
                                            className={`flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md font-medium transition-all ${
                                                version.isLocked
                                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm'
                                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {actionLoading === `lock-${version.id}` ? (
                                                <>Processing...</>
                                            ) : version.isLocked ? (
                                                <>
                                                    <Unlock size={14} />
                                                    Unlock
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={14} />
                                                    Lock
                                                </>
                                            )}
                                        </button>
                                        {version.versionNumber !== formulation.versions[0].versionNumber && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRollback(version);
                                                }}
                                                disabled={actionLoading === `rollback-${version.id}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === `rollback-${version.id}` ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <>
                                                        <History size={14} />
                                                        Rollback
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Version Details */}
                <div className="lg:col-span-2">
                    {selectedVersion ? (
                        <div className="border border-gray-300 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">
                                        Version {selectedVersion.versionNumber} Details
                                    </h2>
                                    {selectedVersion.notes && (
                                        <p className="text-sm text-gray-600 mb-3">{selectedVersion.notes}</p>
                                    )}
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(selectedVersion.creationDate).toLocaleString()}
                                        </div>
                                        {selectedVersion.creator && (
                                            <div className="flex items-center gap-2">
                                                <User size={14} />
                                                {selectedVersion.creator.firstName} {selectedVersion.creator.lastName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {selectedVersion.isLocked ? (
                                        <Badge className="bg-green-100 text-green-700 border border-green-300 flex items-center gap-2 px-3 py-1.5">
                                            <Lock size={14} />
                                            Approved for Production
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
                                            <Unlock size={14} />
                                            Draft
                                        </Badge>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleLockToggle(selectedVersion)}
                                            disabled={actionLoading === `lock-${selectedVersion.id}`}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                                                selectedVersion.isLocked
                                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {actionLoading === `lock-${selectedVersion.id}` ? (
                                                <>Processing...</>
                                            ) : selectedVersion.isLocked ? (
                                                <>
                                                    <Unlock size={16} />
                                                    Unlock Version
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={16} />
                                                    Lock for Production
                                                </>
                                            )}
                                        </button>
                                        {selectedVersion.versionNumber !== formulation.versions[0].versionNumber && (
                                            <button
                                                onClick={() => handleRollback(selectedVersion)}
                                                disabled={actionLoading === `rollback-${selectedVersion.id}`}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === `rollback-${selectedVersion.id}` ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <>
                                                        <History size={16} />
                                                        Rollback to This
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Composition Summary */}
                            <div className={`p-4 rounded-lg mb-6 ${
                                Math.abs(totalComposition - 100) < 0.01
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                                <p className="text-sm font-semibold">
                                    Total Composition: {' '}
                                    <span className={
                                        Math.abs(totalComposition - 100) < 0.01
                                            ? 'text-green-700'
                                            : 'text-yellow-700'
                                    }>
                                        {totalComposition.toFixed(2)}%
                                    </span>
                                </p>
                            </div>

                            {/* Ingredients Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-semibold">#</th>
                                            <th className="text-left p-3 text-sm font-semibold">Material</th>
                                            <th className="text-left p-3 text-sm font-semibold">Type</th>
                                            <th className="text-right p-3 text-sm font-semibold">Composition</th>
                                            <th className="text-left p-3 text-sm font-semibold">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedVersion.ingredients.map((ingredient, index) => (
                                            <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-sm">{index + 1}</td>
                                                <td className="p-3 text-sm font-medium">{ingredient.material.name}</td>
                                                <td className="p-3 text-sm">
                                                    <Badge variant="outline" className="text-xs">
                                                        {ingredient.material.type}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm text-right font-semibold">
                                                    {ingredient.percentageOrComposition.toFixed(2)} {ingredient.unit}
                                                </td>
                                                <td className="p-3 text-sm text-gray-600">
                                                    {ingredient.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-300 rounded-lg p-6 text-center text-gray-500">
                            Select a version to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showVersionModal && (
                <VersionModal
                    formulationId={id!}
                    setOpen={setShowVersionModal}
                    onSuccess={fetchFormulation}
                />
            )}

            {showComparisonModal && formulation.versions.length >= 2 && (
                <VersionComparisonModal
                    formulationId={id!}
                    versions={formulation.versions}
                    setOpen={setShowComparisonModal}
                />
            )}
        </div>
    );
};

export default FormulationDetails;

