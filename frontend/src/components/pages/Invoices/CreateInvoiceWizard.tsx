import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatIndianCurrency, convertToWords } from '@/lib/gstCalculator';

interface Client {
  id: string;
  name: string;
  gstNumber: string;
  address: string;
  email: string;
  phone: string;
}

interface FinishedGood {
  id: string;
  productName: string;
  availableQuantity: number;
  unitPrice: number;
  hsnCode: string;
  batch: {
    batchCode: string;
  };
}

interface InvoiceItem {
  finishedGoodId: string;
  productName: string;
  batchCode: string;
  quantity: number;
  pricePerUnit: number;
  hsnCode: string;
  amount: number;
  gstRate: number; // GST slab rate (0, 5, 12, 18, 28)
}

const CreateInvoiceWizard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchFinishedGoods();
    
    // Set default due date to 30 days from now
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    setDueDate(thirtyDaysLater.toISOString().split('T')[0]);
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients', { params: { isActive: 'true' } });
      setClients(response.data.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchFinishedGoods = async () => {
    try {
      const response = await api.get('/api/finished-goods', {
        params: { availableOnly: 'true', qualityStatus: 'Approved' }
      });
      setFinishedGoods(response.data.finishedGoods || []);
    } catch (err) {
      console.error('Error fetching finished goods:', err);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
  };

  const handleAddItem = (finishedGoodId: string) => {
    const good = finishedGoods.find(g => g.id === finishedGoodId);
    if (!good) return;

    const existingItem = items.find(item => item.finishedGoodId === finishedGoodId);
    if (existingItem) {
      setError('Item already added. Update quantity instead.');
      return;
    }

    const newItem: InvoiceItem = {
      finishedGoodId: good.id,
      productName: good.productName,
      batchCode: good.batch.batchCode,
      quantity: 1,
      pricePerUnit: good.unitPrice,
      hsnCode: good.hsnCode,
      amount: good.unitPrice,
      gstRate: 18, // Default to 18% (most common for cosmetics/pharmaceuticals)
    };

    setItems([...items, newItem]);
    setError(null);
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'pricePerUnit' | 'gstRate', value: number) => {
    const updatedItems = [...items];
    if (field === 'gstRate') {
      updatedItems[index].gstRate = value;
    } else {
      updatedItems[index][field] = value;
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].pricePerUnit;
    }
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Indian GST slabs as per regulations
  const GST_SLABS = [
    { value: 0, label: '0% (Nil Rate)' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
  ];

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const isIntrastateTransaction = selectedClient?.gstNumber 
      ? selectedClient.gstNumber.substring(0, 2) === '27' 
      : false;

    // Calculate tax per item and group by GST slab
    const taxBySlab: Record<number, { subtotal: number; cgst: number; sgst: number; igst: number }> = {};
    
    items.forEach(item => {
      if (!taxBySlab[item.gstRate]) {
        taxBySlab[item.gstRate] = { subtotal: 0, cgst: 0, sgst: 0, igst: 0 };
      }
      
      taxBySlab[item.gstRate].subtotal += item.amount;
      
      if (isIntrastateTransaction) {
        // Intrastate: Split GST into CGST and SGST
        taxBySlab[item.gstRate].cgst += (item.amount * item.gstRate) / 200;
        taxBySlab[item.gstRate].sgst += (item.amount * item.gstRate) / 200;
      } else {
        // Interstate: Only IGST
        taxBySlab[item.gstRate].igst += (item.amount * item.gstRate) / 100;
      }
    });

    // Round all values
    Object.keys(taxBySlab).forEach(slab => {
      const rate = parseFloat(slab);
      taxBySlab[rate].cgst = Math.round(taxBySlab[rate].cgst * 100) / 100;
      taxBySlab[rate].sgst = Math.round(taxBySlab[rate].sgst * 100) / 100;
      taxBySlab[rate].igst = Math.round(taxBySlab[rate].igst * 100) / 100;
    });

    // Calculate totals
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    Object.values(taxBySlab).forEach(tax => {
      totalCGST += tax.cgst;
      totalSGST += tax.sgst;
      totalIGST += tax.igst;
    });

    const totalTax = totalCGST + totalSGST + totalIGST;
    const totalAmount = subtotal + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round(totalCGST * 100) / 100,
      sgst: Math.round(totalSGST * 100) / 100,
      igst: Math.round(totalIGST * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      isIntrastate: isIntrastateTransaction,
      taxBySlab, // Include breakdown by slab
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    // Validate quantities
    for (const item of items) {
      const good = finishedGoods.find(g => g.id === item.finishedGoodId);
      if (good && item.quantity > good.availableQuantity) {
        setError(`Insufficient stock for ${item.productName}. Available: ${good.availableQuantity}`);
        return;
      }
    }

    try {
      setCreating(true);
      setError(null);

      const payload = {
        clientId: selectedClientId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        items: items.map(item => ({
          finishedGoodId: item.finishedGoodId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          hsnCode: item.hsnCode,
          gstRate: item.gstRate, // Include GST rate per item
        })),
        notes,
      };

      const response = await api.post('/api/invoices', payload);
      navigate(`/sales/invoices/${response.data.invoice.id}`);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const totals = items.length > 0 ? calculateTotals() : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/sales/invoices')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <p className="text-sm text-gray-500">Generate GST-compliant invoice for client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Client & Date Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Select Client *</label>
                <select
                  value={selectedClientId}
                  onChange={handleClientChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.gstNumber ? `(${client.gstNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold">{selectedClient.name}</p>
                  {selectedClient.address && (
                    <p className="text-sm text-gray-700">{selectedClient.address}</p>
                  )}
                  {selectedClient.gstNumber && (
                    <p className="text-sm">
                      <span className="font-semibold">GST:</span> {selectedClient.gstNumber}
                    </p>
                  )}
                  {selectedClient.email && (
                    <p className="text-sm">
                      <span className="font-semibold">Email:</span> {selectedClient.email}
                    </p>
                  )}
                  {selectedClient.phone && (
                    <p className="text-sm">
                      <span className="font-semibold">Phone:</span> {selectedClient.phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Dates */}
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Invoice Date *</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={invoiceDate}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
                  placeholder="Add invoice notes or terms..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Items */}
        <div className="border border-gray-300 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Invoice Items</h2>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">+ Add Product</option>
              {finishedGoods.map(good => (
                <option key={good.id} value={good.id}>
                  {good.productName} - {good.batch.batchCode} (Avail: {good.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items added. Select products from the dropdown above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2">
                  <tr>
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3">Batch</th>
                    <th className="text-left p-3">HSN</th>
                    <th className="text-left p-3">Qty</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-center p-3">GST Slab</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{item.productName}</td>
                      <td className="p-3 font-mono text-xs">{item.batchCode}</td>
                      <td className="p-3 font-mono text-xs">{item.hsnCode}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-right"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.pricePerUnit}
                          onChange={(e) => handleUpdateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                          className="border border-gray-300 rounded px-2 py-1 w-24 text-right"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleUpdateItem(index, 'gstRate', parseFloat(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {GST_SLABS.map(slab => (
                            <option key={slab.value} value={slab.value}>
                              {slab.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatIndianCurrency(item.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tax Calculation */}
        {totals && (
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold">Tax Calculation</h2>
              <Badge className={`ml-2 ${totals.isIntrastate ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {totals.isIntrastate ? 'Intrastate (CGST + SGST)' : 'Interstate (IGST)'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatIndianCurrency(totals.subtotal)}</span>
              </div>

              {/* Tax breakdown by GST slab */}
              {Object.keys(totals.taxBySlab).length > 0 && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <p className="text-sm font-semibold mb-2 text-gray-700">Tax Breakdown by GST Slab:</p>
                  {Object.entries(totals.taxBySlab)
                    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // Sort by rate descending
                    .map(([rate, tax]) => {
                      const gstRate = parseFloat(rate);
                      if (gstRate === 0 || (tax.cgst === 0 && tax.sgst === 0 && tax.igst === 0)) return null;
                      
                      return (
                        <div key={rate} className="mb-2 pl-4 border-l-2 border-blue-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1">GST @ {gstRate}% (Subtotal: {formatIndianCurrency(tax.subtotal)})</p>
                          {totals.isIntrastate ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="pl-2">CGST @ {gstRate / 2}%:</span>
                                <span>{formatIndianCurrency(tax.cgst)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="pl-2">SGST @ {gstRate / 2}%:</span>
                                <span>{formatIndianCurrency(tax.sgst)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="pl-2">IGST @ {gstRate}%:</span>
                              <span>{formatIndianCurrency(tax.igst)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Total Tax Summary */}
              <div className="border-t border-gray-300 pt-2 mt-2">
                {totals.isIntrastate ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold">Total CGST:</span>
                      <span className="font-semibold">{formatIndianCurrency(totals.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Total SGST:</span>
                      <span className="font-semibold">{formatIndianCurrency(totals.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="font-semibold">Total IGST:</span>
                    <span className="font-semibold">{formatIndianCurrency(totals.igst)}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-400 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount:</span>
                  <span>{formatIndianCurrency(totals.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 italic">
                  {convertToWords(totals.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4 border-t pt-6">
          <Button
            type="button"
            onClick={() => navigate('/sales/invoices')}
            variant="outline"
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !selectedClientId || items.length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
          >
            {creating ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoiceWizard;

