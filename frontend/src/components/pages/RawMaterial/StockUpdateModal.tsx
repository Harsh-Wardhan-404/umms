import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import api from '@/lib/api';

interface StockUpdateModalProps {
    materialId: string;
    materialName: string;
    currentStock: number;
    unit: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
    materialId,
    materialName,
    currentStock,
    unit,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [operation, setOperation] = useState<'add' | 'subtract'>('add');
    const [quantity, setQuantity] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        if (operation === 'subtract' && qty > currentStock) {
            setError('Cannot subtract more than current stock');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await api.patch(`/api/stock/materials/${materialId}/stock`, {
                quantity: qty,
                operation,
                notes: notes || undefined,
            });

            onSuccess();
            onClose();
            window.location.reload();
        } catch (err: any) {
            console.error('Stock update error:', err);
            setError(err.response?.data?.error || 'Failed to update stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    const newStock = operation === 'add' 
        ? currentStock + (parseFloat(quantity) || 0)
        : currentStock - (parseFloat(quantity) || 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">Update Stock</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600">Material</p>
                        <p className="font-semibold">{materialName}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Current Stock</p>
                        <p className="font-semibold">{currentStock} {unit}</p>
                    </div>

                    {/* Operation Selection */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setOperation('add')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${
                                operation === 'add'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 text-gray-600 hover:border-green-300'
                            }`}
                        >
                            <Plus size={18} />
                            Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperation('subtract')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md border-2 transition-colors ${
                                operation === 'subtract'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-300 text-gray-600 hover:border-red-300'
                            }`}
                        >
                            <Minus size={18} />
                            Subtract Stock
                        </button>
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="flex-1 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                                placeholder="Enter quantity"
                                required
                            />
                            <span className="text-gray-600">{unit}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                            placeholder="Add notes about this stock change..."
                            rows={3}
                        />
                    </div>

                    {/* Preview */}
                    {quantity && parseFloat(quantity) > 0 && (
                        <div className={`p-3 rounded-md ${
                            operation === 'add' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                            <p className="text-sm text-gray-600">New Stock Level</p>
                            <p className="text-lg font-semibold">
                                {newStock.toFixed(2)} {unit}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {operation === 'add' ? '+' : '-'}{parseFloat(quantity).toFixed(2)} {unit}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !quantity}
                            className={`flex-1 px-4 py-2 rounded-md text-white ${
                                operation === 'add'
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-red-500 hover:bg-red-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockUpdateModal;

