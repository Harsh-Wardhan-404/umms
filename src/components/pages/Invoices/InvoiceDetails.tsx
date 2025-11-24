import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatIndianCurrency, isIntrastate } from '@/lib/gstCalculator';

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: any[];
  subtotal: number;
  taxDetails: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    gstRate: number;
  };
  totalAmount: number;
  paymentStatus: string;
  notes: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstNumber: string;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
  invoiceItems: Array<{
    id: string;
    quantity: number;
    pricePerUnit: number;
    hsnCode: string;
    batchCode: string;
    finishedGood: {
      productName: string;
    };
  }>;
}

const InvoiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/invoices/${id}`);
      setInvoice(response.data.invoice);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.error || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || 'Invoice not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isIntrastateTxn = isIntrastate(invoice.client.gstNumber || '', '27');

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
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
            <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-gray-500">Invoice Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/sales/invoices/${id}/print`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-mono font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-semibold">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-semibold">
                {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <Badge className={`border ${
                invoice.paymentStatus === 'Paid'
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : invoice.paymentStatus === 'Partial'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
              }`}>
                {invoice.paymentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-semibold">
                {invoice.creator.firstName} {invoice.creator.lastName}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Client Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-semibold">{invoice.client.name}</p>
            </div>
            {invoice.client.gstNumber && (
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-mono">{invoice.client.gstNumber}</p>
              </div>
            )}
            {invoice.client.address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p>{invoice.client.address}</p>
              </div>
            )}
            {invoice.client.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{invoice.client.email}</p>
              </div>
            )}
            {invoice.client.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{invoice.client.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="text-left p-3">S.No</th>
                <th className="text-left p-3">Product Name</th>
                <th className="text-left p-3">Batch Code</th>
                <th className="text-left p-3">HSN Code</th>
                <th className="text-right p-3">Quantity</th>
                <th className="text-right p-3">Rate</th>
                <th className="text-right p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoiceItems.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{item.finishedGood.productName}</td>
                  <td className="p-3 font-mono text-xs">{item.batchCode}</td>
                  <td className="p-3 font-mono text-xs">{item.hsnCode}</td>
                  <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                  <td className="p-3 text-right">{formatIndianCurrency(item.pricePerUnit)}</td>
                  <td className="p-3 text-right font-semibold">
                    {formatIndianCurrency(item.quantity * item.pricePerUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tax Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatIndianCurrency(invoice.subtotal)}</span>
            </div>

            {isIntrastateTxn ? (
              <>
                <div className="flex justify-between">
                  <span>CGST @ {invoice.taxDetails.gstRate / 2}%:</span>
                  <span>{formatIndianCurrency(invoice.taxDetails.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST @ {invoice.taxDetails.gstRate / 2}%:</span>
                  <span>{formatIndianCurrency(invoice.taxDetails.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST @ {invoice.taxDetails.gstRate}%:</span>
                <span>{formatIndianCurrency(invoice.taxDetails.igst)}</span>
              </div>
            )}

            <div className="border-t-2 border-gray-400 pt-2 mt-2">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount:</span>
                <span>{formatIndianCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;

