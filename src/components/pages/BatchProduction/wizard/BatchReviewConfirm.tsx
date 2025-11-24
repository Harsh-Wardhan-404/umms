import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Users, Clock, Calendar, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import type { BatchFormData } from '../CreateBatchWizard';

interface BatchReviewConfirmProps {
  formData: BatchFormData;
  onBack: () => void;
}

const BatchReviewConfirm = ({ formData, onBack }: BatchReviewConfirmProps) => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = useState<any>(null);

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);

      const requestBody = {
        productName: formData.productName,
        formulationVersionId: formData.formulationVersionId,
        batchSize: formData.batchSize,
        workers: formData.workers,
        shift: formData.shift,
        startTime: new Date(formData.startTime).toISOString(),
        productionNotes: formData.productionNotes || '',
      };

      const response = await api.post('/api/batches', requestBody);
      setCreatedBatch(response.data.batch);
    } catch (err: any) {
      console.error('Error creating batch:', err);
      setError(err.response?.data?.error || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  if (createdBatch) {
    return (
      <div className="border border-green-300 rounded-lg p-6 bg-green-50">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle size={32} className="text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-green-900">Batch Created Successfully!</h2>
            <p className="text-green-700">Your batch has been created and materials have been deducted from inventory.</p>
          </div>
        </div>

        {/* Batch Info */}
        <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Batch Code</p>
              <p className="text-lg font-mono font-bold">{createdBatch.batchCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="text-lg font-semibold">{createdBatch.productName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-300">
                {createdBatch.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch Size</p>
              <p className="text-lg font-semibold">{createdBatch.batchSize} units</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white border border-green-200 rounded-lg p-6 text-center mb-6">
          <h3 className="text-lg font-semibold mb-4">Batch QR Code</h3>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
              <QRCodeSVG value={createdBatch.batchCode} size={200} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Scan this QR code to quickly access batch details
          </p>
          <p className="text-xs text-gray-500 font-mono">{createdBatch.batchCode}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate(`/production/batch-production/${createdBatch.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
          >
            View Batch Details
          </Button>
          <Button
            onClick={() => navigate('/production/batch-production')}
            variant="outline"
            className="px-6 py-2"
          >
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-6">Review & Confirm</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Product & Formulation */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Product & Formulation</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Product Name</p>
              <p className="font-semibold">{formData.productName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Formulation Version</p>
              <p className="font-semibold">Version {formData.versionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Batch Size</p>
              <p className="font-semibold">{formData.batchSize} units</p>
            </div>
          </div>
        </div>

        {/* Material Requirements */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Material Requirements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-2">Material</th>
                  <th className="text-right p-2">Required</th>
                  <th className="text-right p-2">Available</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {formData.ingredients.map((ing, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{ing.materialName}</td>
                    <td className="p-2 text-right font-semibold">
                      {ing.quantityRequired.toFixed(2)} {ing.unit}
                    </td>
                    <td className="p-2 text-right">
                      {ing.availableStock.toFixed(2)} {ing.unit}
                    </td>
                    <td className="p-2 text-center">
                      <CheckCircle size={16} className="text-green-600 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workers & Shift */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Workers & Shift</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Workers Assigned</p>
              <p className="font-semibold">{formData.workers.length} worker(s)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Shift</p>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-300">
                {formData.shift}
              </Badge>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Schedule</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Start Time</p>
              <p className="font-semibold">
                {new Date(formData.startTime).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Production Notes */}
        {formData.productionNotes && (
          <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
            <h3 className="font-semibold text-gray-900 mb-2">Production Notes</h3>
            <p className="text-sm text-gray-700">{formData.productionNotes}</p>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Materials will be automatically deducted from inventory</li>
                <li>A unique batch code and QR code will be generated</li>
                <li>You will be assigned as the supervisor for this batch</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-6 py-2"
            disabled={creating}
          >
            Back
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating Batch...' : 'Confirm & Create Batch'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchReviewConfirm;

