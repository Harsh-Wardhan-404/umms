import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface ReportData {
  batchInfo: {
    batchCode: string;
    productName: string;
    formulationVersion: number;
    batchSize: number;
    status: string;
    shift: string;
    startTime: string;
    endTime?: string;
    supervisor: {
      firstName: string;
      lastName: string;
    };
  };
  materialUsage: Array<{
    materialName: string;
    materialType: string;
    quantityUsed: number;
    unit: string;
    costPerUnit?: number;
    totalCost?: number;
  }>;
  qualityChecks: Array<{
    checkType: string;
    result: string;
    inspector: string;
    timestamp: string;
    notes: string;
  }>;
  timeline: Array<{
    event: string;
    timestamp: string;
    description: string;
  }>;
  workers: Array<{
    name: string;
    role: string;
  }>;
  summary: {
    totalMaterialCost?: number;
    productionDuration?: string;
    qualityPassRate: number;
    efficiency?: number;
  };
}

const ProductionReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/batches/${id}/report`);
      setReport(response.data.report);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.error || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || 'Report not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header (hidden on print) */}
      <div className="flex justify-between items-center no-print">
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
            <h1 className="text-2xl font-bold">Production Report</h1>
            <p className="text-sm text-gray-500">Comprehensive batch analysis</p>
          </div>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Printer size={16} />
          Print Report
        </Button>
      </div>

      {/* Report Content */}
      <div className="bg-white border border-gray-300 rounded-lg p-8 print:border-0 print:p-0">
        {/* Report Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold mb-2">Production Report</h1>
          <p className="text-lg text-gray-600">Batch Code: {report.batchInfo.batchCode}</p>
          <p className="text-sm text-gray-500">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>

        {/* Batch Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText size={20} />
            Batch Information
          </h2>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Product Name</p>
              <p className="font-semibold">{report.batchInfo.productName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Formulation Version</p>
              <p className="font-semibold">Version {report.batchInfo.formulationVersion}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch Size</p>
              <p className="font-semibold">{report.batchInfo.batchSize} units</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className="print:border print:px-2 print:py-1">
                {report.batchInfo.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shift</p>
              <p className="font-semibold">{report.batchInfo.shift}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supervisor</p>
              <p className="font-semibold">
                {report.batchInfo.supervisor.firstName} {report.batchInfo.supervisor.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Time</p>
              <p className="font-semibold">
                {new Date(report.batchInfo.startTime).toLocaleString()}
              </p>
            </div>
            {report.batchInfo.endTime && (
              <div>
                <p className="text-sm text-gray-600">End Time</p>
                <p className="font-semibold">
                  {new Date(report.batchInfo.endTime).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Material Usage */}
        {report.materialUsage && report.materialUsage.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Material Usage</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-3">Material Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Quantity Used</th>
                  {report.materialUsage.some(m => m.totalCost) && (
                    <th className="text-right p-3">Cost</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.materialUsage.map((material, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{material.materialName}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="print:border">
                        {material.materialType}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {material.quantityUsed.toFixed(2)} {material.unit}
                    </td>
                    {material.totalCost && (
                      <td className="p-3 text-right">
                        ${material.totalCost.toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
                {report.summary?.totalMaterialCost && (
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={3} className="p-3 text-right">Total Material Cost:</td>
                    <td className="p-3 text-right">${report.summary.totalMaterialCost.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Workers */}
        {report.workers && report.workers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Workers Assigned</h2>
            <div className="grid grid-cols-3 gap-4">
              {report.workers.map((worker, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold">{worker.name}</p>
                  <p className="text-sm text-gray-600">{worker.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Checks */}
        {report.qualityChecks && report.qualityChecks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Quality Checks</h2>
            <div className="space-y-3">
              {report.qualityChecks.map((check, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{check.checkType}</p>
                      <p className="text-sm text-gray-600">Inspector: {check.inspector}</p>
                    </div>
                    <Badge
                      className={
                        check.result === 'pass'
                          ? 'bg-green-100 text-green-700 print:border'
                          : 'bg-red-100 text-red-700 print:border'
                      }
                    >
                      {check.result.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{check.notes}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(check.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Production Timeline */}
        {report.timeline && report.timeline.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Production Timeline</h2>
            <div className="space-y-2">
              {report.timeline.map((event, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-32 flex-shrink-0 text-sm text-gray-600">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{event.event}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {report.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {report.summary.productionDuration && (
                <div>
                  <p className="text-sm text-gray-600">Production Duration</p>
                  <p className="text-lg font-semibold">{report.summary.productionDuration}</p>
                </div>
              )}
              {report.summary.qualityPassRate !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Quality Pass Rate</p>
                  <p className="text-lg font-semibold">{report.summary.qualityPassRate.toFixed(1)}%</p>
                </div>
              )}
              {report.summary.efficiency && (
                <div>
                  <p className="text-sm text-gray-600">Production Efficiency</p>
                  <p className="text-lg font-semibold">{report.summary.efficiency.toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p>This is an automated production report generated by UMMS</p>
          <p>Report ID: {report.batchInfo?.batchCode || 'N/A'} | Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductionReport;

