import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { CompanyProfile } from "@/lib/types";
import toast from "react-hot-toast";
import { Check, Edit2, Plus, Star, Trash2 } from "lucide-react";

const emptyForm = {
  name: "",
  address: "",
  gstin: "",
  phone: "",
  bankName: "",
  bankBranch: "",
  bankAccountNo: "",
  bankIfscCode: "",
  bankUpiId: "",
  isDefault: false,
};

const CompanySettings = () => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/company-profiles");
      setCompanies(res.data.companies || []);
    } catch (err: any) {
      console.error("Failed to fetch company profiles", err);
      toast.error(err.response?.data?.error || "Failed to fetch company profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/company-profiles/${editingId}`, form);
        toast.success("Company updated");
      } else {
        await api.post("/api/company-profiles", form);
        toast.success("Company created");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      loadCompanies();
    } catch (err: any) {
      console.error("Failed to save company profile", err);
      toast.error(err.response?.data?.error || "Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (company: CompanyProfile) => {
    setEditingId(company.id);
    setForm({
      name: company.name || "",
      address: company.address || "",
      gstin: company.gstin || "",
      phone: company.phone || "",
      bankName: company.bankName || "",
      bankBranch: company.bankBranch || "",
      bankAccountNo: company.bankAccountNo || "",
      bankIfscCode: company.bankIfscCode || "",
      bankUpiId: company.bankUpiId || "",
      isDefault: company.isDefault,
    });
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const setDefault = async (id: string) => {
    try {
      await api.patch(`/api/company-profiles/${id}/default`);
      toast.success("Default company updated");
      loadCompanies();
    } catch (err: any) {
      console.error("Failed to set default company", err);
      toast.error(err.response?.data?.error || "Failed to set default company");
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete this company profile?")) return;
    try {
      await api.delete(`/api/company-profiles/${id}`);
      toast.success("Company deleted");
      if (editingId === id) resetForm();
      loadCompanies();
    } catch (err: any) {
      console.error("Failed to delete company", err);
      toast.error(err.response?.data?.error || "Failed to delete company");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Company Profiles</h1>
          <p className="text-sm text-gray-500">Manage default company, address, and bank details</p>
        </div>
        <Button variant="outline" onClick={resetForm}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Company Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="isDefault" className="text-sm font-semibold">Set as default</label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">GSTIN</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm((prev) => ({ ...prev, gstin: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 27AAAAA0000A1Z5"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., +91-1234567890"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
            placeholder="Enter company address"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Bank Name</label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., State Bank of India"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Branch</label>
            <input
              type="text"
              value={form.bankBranch}
              onChange={(e) => setForm((prev) => ({ ...prev, bankBranch: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mumbai"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Account Number</label>
            <input
              type="text"
              value={form.bankAccountNo}
              onChange={(e) => setForm((prev) => ({ ...prev, bankAccountNo: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1234567890"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">IFSC Code</label>
            <input
              type="text"
              value={form.bankIfscCode}
              onChange={(e) => setForm((prev) => ({ ...prev, bankIfscCode: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., SBIN0001234"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">UPI ID</label>
            <input
              type="text"
              value={form.bankUpiId}
              onChange={(e) => setForm((prev) => ({ ...prev, bankUpiId: e.target.value }))}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., company@upi"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Company" : "Create Company"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {loading ? (
          <p>Loading companies...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">No company profiles yet. Add one above.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {companies.map((company) => (
              <div key={company.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{company.name}</h3>
                    {company.isDefault && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Star className="w-3 h-3 mr-1" /> Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!company.isDefault && (
                      <Button variant="ghost" size="icon" title="Set default" onClick={() => setDefault(company.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => startEdit(company)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteCompany(company.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {company.gstin && <p className="text-sm text-gray-600">GSTIN: {company.gstin}</p>}
                {company.address && <p className="text-sm text-gray-700 whitespace-pre-line">{company.address}</p>}
                {company.phone && <p className="text-sm text-gray-600">Phone: {company.phone}</p>}
                {(company.bankName || company.bankAccountNo) && (
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    {company.bankName && <p>Bank: {company.bankName}{company.bankBranch ? `, ${company.bankBranch}` : ""}</p>}
                    {company.bankAccountNo && <p>A/C: {company.bankAccountNo}</p>}
                    {company.bankIfscCode && <p>IFSC: {company.bankIfscCode}</p>}
                    {company.bankUpiId && <p>UPI: {company.bankUpiId}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;

