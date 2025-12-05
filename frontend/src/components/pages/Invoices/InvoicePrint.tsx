import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatIndianCurrency, convertToWords, isIntrastate } from '@/lib/gstCalculator';

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
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

const InvoicePrint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      const response = await api.get(`/api/invoices/${id}`);
      setInvoice(response.data.invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !invoice) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const isIntrastateTxn = isIntrastate(invoice.client.gstNumber || '', '27');

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button (hidden on print) */}
      <div className="no-print fixed top-4 left-4 z-50 flex gap-2">
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
          Print Invoice
        </Button>
      </div>

      {/* Invoice */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="border-b-4 border-gray-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <img 
                src="/logo.jpeg" 
                alt="Company Logo" 
                className="h-20 w-auto"
                style={{ maxHeight: '80px', objectFit: 'contain' }}
              />
              {/* <div>
                <h1 className="text-3xl font-bold text-gray-900">TAX INVOICE</h1>
                <p className="text-sm text-gray-600 mt-1">ORIGINAL FOR RECIPIENT</p>
              </div> */}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">Sahyadri Nutraceuticals</h2>
              <p className="text-sm">123 Business Address</p>
              <p className="text-sm">City, State - 400001</p>
              <p className="text-sm">GSTIN: 27AAAAA0000A1Z5</p>
              <p className="text-sm">Phone: +91-1234567890</p>
            </div>
          </div>
        </div>

        {/* Invoice Details & Client */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">BILL TO:</h3>
            <div className="border border-gray-300 p-3 rounded">
              <p className="font-bold">{invoice.client.name}</p>
              {invoice.client.address && <p className="text-sm mt-1">{invoice.client.address}</p>}
              {invoice.client.gstNumber && (
                <p className="text-sm mt-1">
                  <span className="font-semibold">GSTIN:</span> {invoice.client.gstNumber}
                </p>
              )}
              {invoice.client.phone && <p className="text-sm">Phone: {invoice.client.phone}</p>}
              {invoice.client.email && <p className="text-sm">Email: {invoice.client.email}</p>}
            </div>
          </div>

          <div className="text-right">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold">Invoice No:</td>
                  <td className="py-1 font-mono">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Invoice Date:</td>
                  <td className="py-1">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Due Date:</td>
                  <td className="py-1">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Payment Status:</td>
                  <td className="py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      invoice.paymentStatus === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-gray-300 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left text-sm">S.No</th>
              <th className="border border-gray-300 p-2 text-left text-sm">Description</th>
              <th className="border border-gray-300 p-2 text-left text-sm">Batch</th>
              <th className="border border-gray-300 p-2 text-center text-sm">HSN</th>
              <th className="border border-gray-300 p-2 text-right text-sm">Qty</th>
              <th className="border border-gray-300 p-2 text-right text-sm">Rate</th>
              <th className="border border-gray-300 p-2 text-right text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoiceItems.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                <td className="border border-gray-300 p-2">{item.finishedGood.productName}</td>
                <td className="border border-gray-300 p-2 text-xs font-mono">{item.batchCode}</td>
                <td className="border border-gray-300 p-2 text-center text-xs font-mono">{item.hsnCode}</td>
                <td className="border border-gray-300 p-2 text-right">{item.quantity.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right">{item.pricePerUnit.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right font-semibold">
                  {(item.quantity * item.pricePerUnit).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-xs font-semibold mb-2">Amount in Words:</p>
            <p className="text-sm italic">{convertToWords(invoice.totalAmount)}</p>
          </div>

          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-right">Subtotal:</td>
                  <td className="py-1 text-right font-semibold">{formatIndianCurrency(invoice.subtotal)}</td>
                </tr>
                {isIntrastateTxn ? (
                  <>
                    <tr>
                      <td className="py-1 text-right">CGST @ {invoice.taxDetails.gstRate / 2}%:</td>
                      <td className="py-1 text-right">{formatIndianCurrency(invoice.taxDetails.cgst)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-right">SGST @ {invoice.taxDetails.gstRate / 2}%:</td>
                      <td className="py-1 text-right">{formatIndianCurrency(invoice.taxDetails.sgst)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="py-1 text-right">IGST @ {invoice.taxDetails.gstRate}%:</td>
                    <td className="py-1 text-right">{formatIndianCurrency(invoice.taxDetails.igst)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-800">
                  <td className="py-2 text-right text-lg font-bold">Total Amount:</td>
                  <td className="py-2 text-right text-lg font-bold">{formatIndianCurrency(invoice.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6 border border-gray-300 p-3 rounded">
            <p className="font-semibold text-sm mb-1">Notes:</p>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}

        {/* Terms & Bank Details */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div className="border border-gray-300 p-3 rounded">
            <p className="font-semibold mb-2">Terms & Conditions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment due within terms specified</li>
              {/* <li>Interest @ 18% p.a. on delayed payments</li> */}
              <li>Subject to jurisdiction</li>
            </ul>
          </div>

          {/* Temporarily hidden - Bank Details */}
          {/* <div className="border border-gray-300 p-3 rounded">
            <p className="font-semibold mb-2">Bank Details:</p>
            <p>Bank Name: XYZ Bank</p>
            <p>Account No: 1234567890</p>
            <p>IFSC Code: XYZB0001234</p>
            <p>Branch: Mumbai</p>
          </div> */}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 flex justify-between items-end">
          <div className="text-xs text-gray-600">
            <p>This is a computer-generated invoice</p>
            <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold mb-8">For Sahyadri Nutraceuticals</p>
            <p className="text-sm border-t border-gray-400 pt-1">Authorized Signatory</p>
          </div>
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
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;

