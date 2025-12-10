import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatIndianCurrency, convertToWords, isIntrastate } from '@/lib/gstCalculator';
import { useReactToPrint } from 'react-to-print';

interface InvoiceItem {
  finishedGoodId: string;
  quantity: number;
  pricePerUnit: number;
  hsnCode: string;
  gstRate: number;
  itemTotal: number;
}

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxDetails: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    gstRate: number;
    taxBreakdown?: Array<{
      rate: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
    }>;
  };
  totalAmount: number;
  paymentStatus: string;
  notes: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPhone?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  bankIfscCode?: string;
  bankUpiId?: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstNumber: string;
  };
  invoiceItems: Array<{
    id: string;
    finishedGoodId: string;
    quantity: number;
    pricePerUnit: number;
    hsnCode: string;
    batchCode: string;
    finishedGood: {
      id: string;
      productName: string;
      unit: string;
    };
  }>;
}

const InvoicePrint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  // Use react-to-print hook
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoice?.invoiceNumber || 'invoice'}`,
  });

  const handleDownloadPDF = () => {
    // For PDF download, we'll trigger the print dialog
    // Users can choose "Save as PDF" in the print dialog
    handlePrint();
  };

  if (loading || !invoice) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const isIntrastateTxn = isIntrastate(invoice.client.gstNumber || '', invoice.companyGstin?.substring(0, 2) || '27');
  
  // Create a map of invoiceItems by finishedGoodId for matching
  const itemsMap = new Map();
  invoice.invoiceItems.forEach(item => {
    itemsMap.set(item.finishedGoodId, item);
  });

  // Match items from JSON array with invoiceItems for display
  const displayItems = invoice.items.map((item) => {
    const invoiceItem = itemsMap.get(item.finishedGoodId) || invoice.invoiceItems[0];
    const taxable = item.quantity * item.pricePerUnit;
    
    // Calculate GST amount based on transaction type
    let gstAmount = 0;
    if (isIntrastateTxn) {
      // Intrastate: CGST + SGST (each half of GST rate)
      gstAmount = (taxable * item.gstRate) / 100;
    } else {
      // Interstate: IGST (full GST rate)
      gstAmount = (taxable * item.gstRate) / 100;
    }
    
    const total = taxable + gstAmount;

    return {
      ...item,
      productName: invoiceItem?.finishedGood?.productName || 'Product',
      batchCode: invoiceItem?.batchCode || '',
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      unit: invoiceItem?.finishedGood?.unit || 'units',
      hsnCode: item.hsnCode,
      taxable: Math.round(taxable * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  });

  // Calculate round off
  const roundOff = Math.round(invoice.totalAmount) - invoice.totalAmount;
  const finalTotal = Math.round(invoice.totalAmount);

  // Get client state code
  const clientStateCode = invoice.client.gstNumber?.substring(0, 2) || '';
  const clientState = clientStateCode === '27' ? 'Maharashtra - 27' : `State - ${clientStateCode}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Action Buttons (hidden on print) */}
      <div className="no-print fixed top-4 left-4 z-50 flex gap-2">
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={handleDownloadPDF} className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
          <Printer size={16} />
          Download PDF / Print
        </Button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="max-w-[210mm] mx-auto p-8 print:p-0 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header - TAX INVOICE Title */}
        <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TAX INVOICE</h1>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>ORIGINAL FOR RECIPIENT</p>
          </div>
        </div>

        {/* Company Details Header */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
          <div className="flex items-start gap-4">
            <img 
              src="/logo.jpeg" 
              alt="Company Logo" 
              className="h-20 w-auto"
              style={{ maxHeight: '80px', objectFit: 'contain' }}
            />
            </div>
            <div className="text-right">
            <h2 className="text-xl font-bold">{invoice.companyName || 'Sahyadri Nutraceuticals'}</h2>
            {invoice.companyAddress && invoice.companyAddress.split('\n').map((line, idx) => (
              <p key={idx} className="text-sm">{line}</p>
            ))}
            {invoice.companyGstin && (
              <p className="text-sm font-semibold">GSTIN: {invoice.companyGstin}</p>
            )}
            {invoice.companyPhone && (
              <p className="text-sm">Contact: {invoice.companyPhone}</p>
            )}
          </div>
        </div>

        {/* Bill To and Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          {/* Bill To */}
          <div>
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">BILL TO:</h3>
            <div className="border border-gray-300 p-3 rounded text-xs">
              <p className="font-bold">{invoice.client.name}</p>
              {invoice.client.address && <p className="mt-1">{invoice.client.address}</p>}
              <p className="mt-1">State: {clientState}</p>
              {invoice.client.gstNumber && (
                <p className="mt-1 font-semibold">GSTIN: {invoice.client.gstNumber}</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">INVOICE DETAILS:</h3>
            <div className="border border-gray-300 p-3 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Inv. No.:</span>
                <span className="font-mono">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Inv. Date:</span>
                <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment Mode:</span>
                <span>{invoice.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Reverse Charge:</span>
                <span>NO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-gray-300 mb-4 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-center">Sr</th>
              <th className="border border-gray-300 p-2 text-left">Goods & Service Description</th>
              <th className="border border-gray-300 p-2 text-center">HSN</th>
              <th className="border border-gray-300 p-2 text-right">Quantity</th>
              <th className="border border-gray-300 p-2 text-right">Rate</th>
              <th className="border border-gray-300 p-2 text-right">Taxable</th>
              <th className="border border-gray-300 p-2 text-center">GST %</th>
              <th className="border border-gray-300 p-2 text-right">GST Amt.</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                <td className="border border-gray-300 p-2">{item.productName}</td>
                <td className="border border-gray-300 p-2 text-center font-mono">{item.hsnCode}</td>
                <td className="border border-gray-300 p-2 text-right">{item.quantity.toFixed(2)} {item.unit}</td>
                <td className="border border-gray-300 p-2 text-right">₹{item.pricePerUnit.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right">₹{item.taxable.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-center">{item.gstRate}%</td>
                <td className="border border-gray-300 p-2 text-right">₹{item.gstAmount.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right font-semibold">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sub-Total Row */}
        <div className="flex justify-end mb-4 text-xs">
          <div className="w-full max-w-md border border-gray-300 p-2 bg-gray-50">
            <div className="flex justify-between">
              <span>Total Items: {displayItems.length}</span>
              <span>Total Taxable Value: ₹{invoice.subtotal.toFixed(2)}</span>
              <span>Total GST Amount: ₹{invoice.taxDetails.totalTax.toFixed(2)}</span>
              <span>Sub-Total: ₹{(invoice.subtotal + invoice.taxDetails.totalTax).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Amount in Words */}
          <div className="border border-gray-300 p-2 rounded">
            <p className="text-xs font-semibold mb-1">Invoice Total in Word:</p>
            <p className="text-xs font-semibold italic">{convertToWords(finalTotal)}</p>
          </div>

          {/* Tax Summary */}
          <div className="border border-gray-300 p-4 rounded">
            <div className="space-y-2 text-sm">
                {isIntrastateTxn ? (
                  <>
                  <div className="flex justify-between">
                    <span>CGST Amt:</span>
                    <span className="font-semibold">₹{invoice.taxDetails.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST Amt:</span>
                    <span className="font-semibold">₹{invoice.taxDetails.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGST Amt:</span>
                    <span>-</span>
                  </div>
                  </>
                ) : (
                <>
                  <div className="flex justify-between">
                    <span>CGST Amt:</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST Amt:</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGST Amt:</span>
                    <span className="font-semibold">₹{invoice.taxDetails.igst.toFixed(2)}</span>
                  </div>
                </>
                )}
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span>Freight Packing Charges:</span>
                <span>-</span>
              </div>
              <div className="flex justify-between">
                <span>Round off:</span>
                <span className="font-semibold">₹{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-800 pt-2 font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {(invoice.bankName || invoice.bankAccountNo) && (
          <div className="border border-gray-300 p-4 rounded mb-6 text-xs">
            <p className="font-bold mb-2">Our Bank Details:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {invoice.bankName && (
                  <p><span className="font-semibold">Bank Name:</span> {invoice.bankName}</p>
                )}
                {invoice.bankBranch && (
                  <p><span className="font-semibold">Branch:</span> {invoice.bankBranch}</p>
                )}
              </div>
              <div>
                {invoice.bankAccountNo && (
                  <p><span className="font-semibold">Account No:</span> {invoice.bankAccountNo}</p>
                )}
                {invoice.bankIfscCode && (
                  <p><span className="font-semibold">IFSC Code:</span> {invoice.bankIfscCode}</p>
                )}
                {invoice.bankUpiId && (
                  <p><span className="font-semibold">UPI ID:</span> {invoice.bankUpiId}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Declaration */}
        <div className="border border-gray-300 p-4 rounded mb-6 text-xs">
          <p className="font-bold mb-2">Declaration:</p>
            <ul className="list-disc list-inside space-y-1">
            <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>
            <li>Subject to jurisdiction of courts in [State] only.</li>
            <li>Goods once sold will not be taken back or exchanged.</li>
            </ul>
          </div>

        {/* Footer with Signature */}
        <div className="border-t-2 border-gray-800 pt-4 flex justify-end items-end">
          <div className="text-right">
            <p className="text-sm font-semibold mb-8">For {invoice.companyName || 'Sahyadri Nutraceuticals'}</p>
            <p className="text-sm border-t border-gray-400 pt-2">Authorised Signatory</p>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8 mb-4">
          <p className="text-lg font-bold text-gray-700">Thank You For Business With US!</p>
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
            color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
        
        /* Ensure better rendering for PDF generation */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        table {
          border-collapse: collapse;
        }
        
        td, th {
          border: 1px solid #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;
