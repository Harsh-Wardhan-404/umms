import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface FinishedGoodFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  type: 'create' | 'update';
  data?: any;
}

interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  status: string;
}

const FinishedGoodForm = ({ setOpen, type, data }: FinishedGoodFormProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    batchId: data?.batchId || '',
    productName: data?.productName || '',
    quantityProduced: data?.quantityProduced || '',
    availableQuantity: data?.availableQuantity || '',
    unit: data?.unit || 'units',
    unitPrice: data?.unitPrice || '',
    hsnCode: data?.hsnCode || '',
    qualityStatus: data?.qualityStatus || 'Approved',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'create') {
      fetchCompletedBatches();
    }
  }, []);

  const fetchCompletedBatches = async () => {
    try {
      const response = await api.get('/api/batches', {
        params: { status: 'Completed' }
      });
      // Filter batches that don't have finished goods yet
      const completedBatches = response.data.batches.filter((b: any) => !b.finishedGood);
      setBatches(completedBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const batch = batches.find(b => b.id === e.target.value);
    if (batch) {
      setFormData(prev => ({
        ...prev,
        batchId: batch.id,
        productName: batch.productName,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        quantityProduced: parseFloat(formData.quantityProduced),
        availableQuantity: parseFloat(formData.availableQuantity),
        unitPrice: parseFloat(formData.unitPrice),
      };

      if (type === 'create') {
        await api.post('/api/finished-goods', payload);
      } else {
        await api.patch(`/api/finished-goods/${data.id}`, payload);
      }

      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving finished good:', err);
      setError(err.response?.data?.error || 'Failed to save finished good');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {type === 'create' ? 'Add Finished Good' : 'Update Finished Good'}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Batch Selection */}
          {type === 'create' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Select Completed Batch *</label>
              <select
                name="batchId"
                value={formData.batchId}
                onChange={handleBatchChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a batch...</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchCode} - {batch.productName}
                  </option>
                ))}
              </select>
              {batches.length === 0 && (
                <p className="text-sm text-yellow-600">
                  No completed batches available. Complete a batch first.
                </p>
              )}
            </div>
          )}

          {/* Product Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Product Name *</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              readOnly={type === 'create'}
            />
          </div>

          {/* Quantity Produced */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Quantity Produced *</label>
            <input
              type="number"
              step="0.01"
              name="quantityProduced"
              value={formData.quantityProduced}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              placeholder="e.g., 100"
            />
            <p className="text-xs text-gray-500">
              Enter total quantity produced in units (bottles, jars, kg, litres, pieces, etc.)
            </p>
          </div>

          {/* Unit */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Unit *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="units">Units</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="liters">Liters (L)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="bottles">Bottles</option>
              <option value="jars">Jars</option>
              <option value="boxes">Boxes</option>
              <option value="packets">Packets</option>
            </select>
            <p className="text-xs text-gray-500">
              Unit of measurement for this product
            </p>
          </div>

          {/* Available Quantity */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Available Quantity *</label>
            <input
              type="number"
              step="0.01"
              name="availableQuantity"
              value={formData.availableQuantity}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              max={formData.quantityProduced || undefined}
              placeholder="e.g., 95"
            />
            <p className="text-xs text-gray-500">
              Quantity available for sale (in {formData.unit || 'units'}). Cannot exceed quantity produced.
            </p>
          </div>

          {/* Unit Price */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Unit Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              placeholder="e.g., 450.00"
            />
            <p className="text-xs text-gray-500">
              Price per {formData.unit || 'unit'}
            </p>
          </div>

          {/* HSN Code */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">HSN Code *</label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., 3304.99"
            />
            <p className="text-xs text-gray-500">
              HSN code for GST calculations
            </p>
          </div>

          {/* Quality Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Quality Status *</label>
            <select
              name="qualityStatus"
              value={formData.qualityStatus}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (type === 'create' && !formData.batchId)}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
            >
              {submitting ? 'Saving...' : type === 'create' ? 'Add Finished Good' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinishedGoodForm;

