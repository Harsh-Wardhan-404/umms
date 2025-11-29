import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface ClientFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  type: 'create' | 'update';
  data?: any;
}

const ClientForm = ({ setOpen, type, data }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    email: data?.email || '',
    phone: data?.phone || '',
    address: data?.address || '',
    gstNumber: data?.gstNumber || '',
    panNumber: data?.panNumber || '',
    contactPerson: data?.contactPerson || '',
    creditLimit: data?.creditLimit || '',
    paymentTerms: data?.paymentTerms || 'Net 30',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateGST = (gst: string): boolean => {
    if (!gst) return true; // Optional field
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstPattern.test(gst);
  };

  const validatePAN = (pan: string): boolean => {
    if (!pan) return true; // Optional field
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phonePattern = /^[\d\s\-\+\(\)]{10,}$/;
    return phonePattern.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field by deleting the key
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const errors: Record<string, string> = {};

    if (name === 'gstNumber' && value && !validateGST(value)) {
      errors.gstNumber = 'Invalid GST format (e.g., 27AAAAA0000A1Z5)';
    }
    if (name === 'panNumber' && value && !validatePAN(value)) {
      errors.panNumber = 'Invalid PAN format (e.g., AAAAA0000A)';
    }
    if (name === 'email' && value && !validateEmail(value)) {
      errors.email = 'Invalid email format';
    }
    if (name === 'phone' && value && !validatePhone(value)) {
      errors.phone = 'Invalid phone number (min 10 digits)';
    }

    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Client name is required';
    }
    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      errors.gstNumber = 'Invalid GST format';
    }
    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      errors.panNumber = 'Invalid PAN format';
    }
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
        gstNumber: formData.gstNumber || null,
        panNumber: formData.panNumber || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        contactPerson: formData.contactPerson || null,
      };

      if (type === 'create') {
        await api.post('/api/clients', payload);
      } else {
        await api.patch(`/api/clients/${data.id}`, payload);
      }

      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.response?.data?.error || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {type === 'create' ? 'Add New Client' : 'Update Client'}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            {/* Client Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Client Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-500">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91-9876543210"
                />
                {validationErrors.phone && (
                  <p className="text-xs text-red-500">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
                placeholder="Full billing address"
              />
            </div>

            {/* Contact Person */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mr./Ms. Contact Name"
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Tax Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* GST Number */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                    validationErrors.gstNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={15}
                />
                {validationErrors.gstNumber && (
                  <p className="text-xs text-red-500">{validationErrors.gstNumber}</p>
                )}
                <p className="text-xs text-gray-500">
                  15-character GST number for tax calculations
                </p>
              </div>

              {/* PAN Number */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                    validationErrors.panNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="AAAAA0000A"
                  maxLength={10}
                />
                {validationErrors.panNumber && (
                  <p className="text-xs text-red-500">{validationErrors.panNumber}</p>
                )}
                <p className="text-xs text-gray-500">
                  10-character PAN number
                </p>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Payment Terms</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Credit Limit */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Credit Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Terms */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Payment Terms</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Net 90">Net 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || Object.values(validationErrors).some(error => error !== '')}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
            >
              {submitting ? 'Saving...' : type === 'create' ? 'Add Client' : 'Update Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;

