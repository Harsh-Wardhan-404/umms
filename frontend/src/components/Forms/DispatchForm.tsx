import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface DispatchFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  type: 'create' | 'update';
  data?: any;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentStatus?: string;
  client: {
    name: string;
    address: string;
  };
}

const DispatchForm = ({ setOpen, type, data }: DispatchFormProps) => {
  console.log('DispatchForm component rendered, type:', type, 'data:', data);
  const [formData, setFormData] = useState({
    invoiceId: data?.invoiceId || '',
    courierName: data?.courierName || '',
    awbNumber: data?.awbNumber || '',
    dispatchDate: data?.dispatchDate ? new Date(data.dispatchDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DispatchForm useEffect called, type:', type);
    if (type === 'create') {
      console.log('Calling fetchAvailableInvoices...');
      fetchAvailableInvoices();
    } else if (data?.invoice) {
      setSelectedInvoice(data.invoice);
    }
  }, [type, data]);

  const fetchAvailableInvoices = async () => {
    console.log('fetchAvailableInvoices function called');
    setLoadingInvoices(true);
    try {
      setError(null);
      console.log('Fetching invoices from API...');
      // Fetch invoices that don't have dispatches yet
      // Allow all payment statuses: Pending, Partial, and Paid
      const response = await api.get('/api/invoices', {
        params: {
          page: 1,
          limit: 1000 // Increased limit to get all invoices
        }
      });
      
      console.log('API response received:', response);

      // Filter out invoices that already have dispatches
      const allInvoices = response.data?.invoices || [];
      console.log('Fetched invoices:', allInvoices.length, 'Total invoices');
      
      const dispatchesResponse = await api.get('/api/dispatches', {
        params: { limit: 1000 }
      });
      
      const invoicesWithDispatch = (dispatchesResponse.data?.dispatches || []).map(
        (d: any) => d.invoice?.id
      ).filter(Boolean); // Remove any undefined/null values
      
      console.log('Invoices with dispatch:', invoicesWithDispatch.length);

      const availableInvoices = allInvoices.filter(
        (inv: Invoice) => !invoicesWithDispatch.includes(inv.id)
      );

      console.log('Available invoices for dispatch:', availableInvoices.length);
      console.log('Available invoices:', availableInvoices.map((inv: Invoice) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        paymentStatus: (inv as any).paymentStatus
      })));

      setInvoices(availableInvoices);
      console.log('Invoices set in state:', availableInvoices.length);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch available invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    // If invoice is selected, update selected invoice
    if (name === 'invoiceId' && value) {
      const invoice = invoices.find(inv => inv.id === value);
      setSelectedInvoice(invoice || null);
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (type === 'create' && !formData.invoiceId) {
      errors.invoiceId = 'Invoice is required';
    }

    if (!formData.courierName || formData.courierName.trim().length < 2) {
      errors.courierName = 'Courier name must be at least 2 characters';
    }

    if (formData.courierName.trim().length > 50) {
      errors.courierName = 'Courier name must not exceed 50 characters';
    }

    if (!formData.awbNumber) {
      errors.awbNumber = 'AWB number is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.awbNumber)) {
      errors.awbNumber = 'AWB number must be alphanumeric';
    }

    if (!formData.dispatchDate) {
      errors.dispatchDate = 'Dispatch date is required';
    } else {
      const selectedDate = new Date(formData.dispatchDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.dispatchDate = 'Dispatch date cannot be in the future';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === 'create') {
        await api.post('/api/dispatches', formData);
      } else {
        // For update, only send editable fields
        await api.patch(`/api/dispatches/${data.id}`, {
          courierName: formData.courierName,
          awbNumber: formData.awbNumber,
          dispatchDate: formData.dispatchDate
        });
      }

      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving dispatch:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save dispatch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1A1C22] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">
            {type === 'create' ? 'Create Dispatch' : 'Update Dispatch'}
          </h2>
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
          {/* Invoice Selection (only for create) */}
          {type === 'create' && (
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Invoice <span className="text-red-500">*</span>
              </label>
              <select
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleChange}
                disabled={loadingInvoices}
                className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingInvoices ? 'Loading invoices...' : 'Select an invoice'}
                </option>
                {!loadingInvoices && invoices.length === 0 ? (
                  <option value="" disabled>No available invoices (all may have dispatches already)</option>
                ) : (
                  invoices.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.client.name} - ₹{invoice.totalAmount.toFixed(2)} {invoice.paymentStatus ? `(${invoice.paymentStatus})` : ''}
                  </option>
                  ))
                )}
              </select>
              {validationErrors.invoiceId && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.invoiceId}</p>
              )}
            </div>
          )}

          {/* Client Details Preview */}
          {selectedInvoice && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-[#282C35] dark:border-gray-600">
              <h3 className="font-semibold mb-2 dark:text-white">Client Details</h3>
              <div className="space-y-1 text-sm">
                <p className="dark:text-gray-300">
                  <span className="font-medium">Name:</span> {selectedInvoice.client.name}
                </p>
                {selectedInvoice.client.address && (
                  <p className="dark:text-gray-300">
                    <span className="font-medium">Address:</span> {selectedInvoice.client.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Courier Name */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Courier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="courierName"
              value={formData.courierName}
              onChange={handleChange}
              placeholder="e.g., DTDC, BlueDart, Delhivery"
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            />
            {validationErrors.courierName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.courierName}</p>
            )}
          </div>

          {/* AWB Number */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              AWB Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="awbNumber"
              value={formData.awbNumber}
              onChange={handleChange}
              placeholder="Air Waybill Number (alphanumeric)"
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white font-mono"
            />
            {validationErrors.awbNumber && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.awbNumber}</p>
            )}
          </div>

          {/* Dispatch Date */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Dispatch Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dispatchDate"
              value={formData.dispatchDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            />
            {validationErrors.dispatchDate && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.dispatchDate}</p>
            )}
          </div>

          {/* Status Info (only for create) */}
          {type === 'create' && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Initial Status:</span> Ready
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Status can be updated after dispatch is created
              </p>
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
              disabled={loading || Object.values(validationErrors).some(error => error !== '')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? 'Saving...' : type === 'create' ? 'Create Dispatch' : 'Update Dispatch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchForm;

