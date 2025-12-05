import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface PaymentStatusModalProps {
  invoice: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdate: () => void;
}

const PaymentStatusModal = ({ invoice, setOpen, onUpdate }: PaymentStatusModalProps) => {
  const [paymentStatus, setPaymentStatus] = useState(invoice.paymentStatus || 'Pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'Partial', label: 'Partial', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'Paid', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-300' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentStatus === invoice.paymentStatus) {
      setError('Please select a different payment status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.patch(`/api/invoices/${invoice.id}/payment-status`, {
        paymentStatus,
        notes: notes || undefined
      });

      setOpen(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusColor = () => {
    const current = statusOptions.find(opt => opt.value === invoice.paymentStatus);
    return current?.color || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1A1C22] rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <DollarSign size={24} className="text-green-600" />
            <h2 className="text-xl font-bold dark:text-white">Update Payment Status</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Info */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-[#282C35] dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Invoice Number</p>
            <p className="font-mono font-semibold text-lg dark:text-white mb-3">
              {invoice.invoiceNumber}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
            <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
              ₹{invoice.totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Current Status */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-[#282C35] dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Status</p>
            <Badge className={`border ${getCurrentStatusColor()}`}>
              {invoice.paymentStatus}
            </Badge>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              New Payment Status <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the updated payment status for this invoice
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any payment-related notes..."
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: Partial payment of ₹X received via bank transfer
            </p>
          </div>

          {/* Status Info */}
          {paymentStatus === 'Paid' && invoice.paymentStatus !== 'Paid' && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-300 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">✓ Full Payment</p>
                <p className="text-xs text-green-600 mt-1">
                  This will mark the invoice as fully paid.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'Partial' && (
            <div className="flex gap-2 p-3 bg-blue-50 border border-blue-300 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">ℹ Partial Payment</p>
                <p className="text-xs text-blue-600 mt-1">
                  Indicates that some payment has been received, but the full amount is still pending.
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || paymentStatus === invoice.paymentStatus}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentStatusModal;

