import { X, FileText, Download, ExternalLink } from "lucide-react";
import type { StockManagement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { categoryBadgeStyles } from "@/lib/utils";
import clsx from "clsx";
import api from "@/lib/api";

interface MaterialDetailsModalProps {
  isOpen: boolean;
  material: StockManagement | null;
  onClose: () => void;
}

const MaterialDetailsModal = ({ isOpen, material, onClose }: MaterialDetailsModalProps) => {
  if (!isOpen || !material) return null;

  const getCategoryBadgeStyle = (category: string) => {
    const style = categoryBadgeStyles[category as keyof typeof categoryBadgeStyles];
    return (
      <Badge className={clsx("py-1", style)}>
        {category}
      </Badge>
    );
  };

  const getBillUrl = (billUrl: string | null | undefined) => {
    if (!billUrl) return null;
    // If the URL already starts with http, return as is
    if (billUrl.startsWith('http')) return billUrl;
    // Otherwise, prepend the API base URL (same as api.ts)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    // Ensure the billUrl starts with / for proper URL construction
    const url = billUrl.startsWith('/') ? billUrl : `/${billUrl}`;
    return `${baseURL}${url}`;
  };

  const handleViewBill = (billUrl: string | null | undefined) => {
    const fullUrl = getBillUrl(billUrl);
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  const handleDownloadBill = (billUrl: string | null | undefined, billNumber: string) => {
    const fullUrl = getBillUrl(billUrl);
    if (fullUrl) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `Bill-${billNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const purchaseHistory = material.purchaseHistory || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">{material.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              {getCategoryBadgeStyle(material.type)}
              <span className="text-sm text-gray-500">
                {material.currentStockQty} {material.unit} in stock
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Material Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Material Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="font-semibold">{material.currentStockQty} {material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Minimum Threshold</p>
                <p className="font-semibold">{material.minThresholdQty} {material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-semibold">{material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {material.currentStockQty <= material.minThresholdQty ? (
                  <Badge className="bg-red-200 border-1 border-red-500 text-red-500">Low Stock</Badge>
                ) : (
                  <Badge className="bg-green-200 border-1 border-green-500 text-green-500">In Stock</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Purchase History</h3>
            {purchaseHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No purchase history available</p>
            ) : (
              <div className="space-y-4">
                {purchaseHistory.map((purchase: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">Bill #{purchase.billNumber || 'N/A'}</h4>
                          {purchase.scannedBillUrl && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Bill Available
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Supplier</p>
                            <p className="font-medium">{purchase.supplierName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Purchase Date</p>
                            <p className="font-medium">
                              {purchase.purchaseDate
                                ? new Date(purchase.purchaseDate).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium">
                              {purchase.purchasedQty || 0} {material.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Cost Per Unit</p>
                            <p className="font-medium">
                              ₹{purchase.costPerUnit?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        {purchase.purchasedQty && purchase.costPerUnit && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm">
                              <span className="text-gray-500">Total Cost: </span>
                              <span className="font-semibold">
                                ₹{(purchase.purchasedQty * purchase.costPerUnit).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {purchase.scannedBillUrl ? (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewBill(purchase.scannedBillUrl)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                        >
                          <ExternalLink size={16} />
                          View Bill
                        </button>
                        <button
                          onClick={() => handleDownloadBill(purchase.scannedBillUrl, purchase.billNumber || `Bill-${index + 1}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                        <FileText size={16} />
                        <span>No bill uploaded for this purchase</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailsModal;

