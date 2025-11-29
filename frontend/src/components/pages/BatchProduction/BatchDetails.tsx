import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Printer, Upload, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QRCodeDisplay from './components/QRCodeDisplay';
import PhotoUpload from './components/PhotoUpload';
import StatusUpdateModal from './components/StatusUpdateModal';
import QualityCheckForm from './components/QualityCheckForm';
import api from '@/lib/api';

interface BatchDetails {
  id: string;
  batchCode: string;
  productName: string;
  formulationVersionId: string;
  batchSize: number;
  supervisorId: string;
  workers: string[];
  shift: string;
  startTime: string;
  endTime?: string;
  status: string;
  rawMaterialsUsed: any[];
  qrCodeData: string;
  photos: any[];
  productionNotes?: string;
  qualityChecks: any[];
  createdAt: string;
  updatedAt: string;
  formulationVersion: {
    id: string;
    versionNumber: number;
    formulation: {
      productName: string;
    };
  };
  supervisor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  materialsUsed: Array<{
    id: string;
    materialId: string;
    quantityUsed: number;
    material: {
      id: string;
      name: string;
      type: string;
      unit: string;
    };
  }>;
}

const statusColors: Record<string, string> = {
  Planned: "bg-blue-100 text-blue-700 border-blue-300",
  InProgress: "bg-yellow-100 text-yellow-700 border-yellow-300",
  QualityCheck: "bg-purple-100 text-purple-700 border-purple-300",
  Completed: "bg-green-100 text-green-700 border-green-300",
  Cancelled: "bg-red-100 text-red-700 border-red-300",
};

const BatchDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'all' | 'before' | 'after'>('all');

  useEffect(() => {
    if (id) {
      fetchBatchDetails();
    }
  }, [id]);

  useEffect(() => {
    // Check if URL has #qr hash
    if (window.location.hash === '#qr') {
      setShowQRCode(true);
    }
  }, []);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/batches/${id}`);
      setBatch(response.data.batch);
    } catch (err: any) {
      console.error('Error fetching batch details:', err);
      setError(err.response?.data?.error || 'Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading batch details...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || 'Batch not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const filteredPhotos = batch.photos.filter(photo => {
    if (activePhotoTab === 'all') return true;
    return photo.type === activePhotoTab;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{batch.batchCode}</h1>
              <Badge className={`border ${statusColors[batch.status]}`}>
                {batch.status}
              </Badge>
            </div>
            <p className="text-lg text-gray-600">{batch.productName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowQRCode(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <QrCode size={16} />
            View QR
          </Button>
          <Button
            onClick={() => setShowStatusUpdate(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
          >
            Update Status
          </Button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Batch Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Batch Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Formulation Version</p>
              <p className="font-semibold">
                Version {batch.formulationVersion.versionNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch Size</p>
              <p className="font-semibold">{batch.batchSize} units</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Supervisor</p>
              <p className="font-semibold">
                {batch.supervisor.firstName} {batch.supervisor.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Workers Assigned</p>
              <p className="font-semibold">{batch.workers.length} worker(s)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shift</p>
              <Badge variant="outline">{batch.shift}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="font-semibold text-sm">
                  {new Date(batch.startTime).toLocaleString()}
                </p>
              </div>
              {batch.endTime && (
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="font-semibold text-sm">
                    {new Date(batch.endTime).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {batch.productionNotes && (
              <div>
                <p className="text-sm text-gray-500">Production Notes</p>
                <p className="text-sm">{batch.productionNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Materials Used */}
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Materials Used</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {batch.materialsUsed.map((material) => (
                  <tr key={material.id} className="border-b">
                    <td className="p-2">{material.material.name}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {material.material.type}
                      </Badge>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {material.quantityUsed.toFixed(2)} {material.material.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Photos</h2>
          <Button
            onClick={() => setShowPhotoUpload(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
            size="sm"
          >
            <Upload size={14} />
            Upload Photos
          </Button>
        </div>

        {/* Photo Tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'before', 'after'].map(tab => (
            <button
              key={tab}
              onClick={() => setActivePhotoTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePhotoTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No photos uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={`Batch photo ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2">
                  <Badge variant="outline" className="text-xs">
                    {photo.type}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(photo.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quality Checks */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Quality Checks</h2>
          <Button
            onClick={() => setShowQualityCheck(true)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
            size="sm"
          >
            <Plus size={14} />
            Add Quality Check
          </Button>
        </div>

        {batch.qualityChecks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No quality checks recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {batch.qualityChecks.map((check, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{check.checkType}</p>
                    <p className="text-sm text-gray-600">{check.notes}</p>
                  </div>
                  <Badge
                    className={
                      check.result === 'pass'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-red-100 text-red-700 border-red-300'
                    }
                  >
                    {check.result.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(check.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Production Report */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Production Report</h2>
            <p className="text-sm text-gray-500">View comprehensive batch report</p>
          </div>
          <Button
            onClick={() => navigate(`/production/batch-production/${id}/report`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            View Report
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showQRCode && (
        <QRCodeDisplay
          batchCode={batch.batchCode}
          setOpen={setShowQRCode}
        />
      )}

      {showPhotoUpload && (
        <PhotoUpload
          batchId={batch.id}
          setOpen={setShowPhotoUpload}
          onSuccess={fetchBatchDetails}
        />
      )}

      {showStatusUpdate && (
        <StatusUpdateModal
          batchId={batch.id}
          currentStatus={batch.status}
          setOpen={setShowStatusUpdate}
          onSuccess={fetchBatchDetails}
        />
      )}

      {showQualityCheck && (
        <QualityCheckForm
          batchId={batch.id}
          setOpen={setShowQualityCheck}
          onSuccess={fetchBatchDetails}
        />
      )}
    </div>
  );
};

export default BatchDetailsPage;

