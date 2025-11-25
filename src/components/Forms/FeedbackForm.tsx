import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface FeedbackFormProps {
  dispatch: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: () => void;
}

const ISSUE_TAG_OPTIONS = [
  'Product Quality',
  'Packaging Damage',
  'Delivery Delay',
  'Incorrect Product',
  'Quantity Mismatch',
  'Other'
];

const FeedbackForm = ({ dispatch, setOpen, onSubmit }: FeedbackFormProps) => {
  const [formData, setFormData] = useState({
    ratingQuality: 0,
    ratingPackaging: 0,
    ratingDelivery: 0,
    clientRemarks: '',
    issueTags: [] as string[]
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (field: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));

    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleIssueTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      issueTags: prev.issueTags.includes(tag)
        ? prev.issueTags.filter(t => t !== tag)
        : [...prev.issueTags, tag]
    }));

    // Clear validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.issueTags;
      return newErrors;
    });
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (formData.ratingQuality === 0) {
      errors.ratingQuality = 'Product quality rating is required';
    }

    if (formData.ratingPackaging === 0) {
      errors.ratingPackaging = 'Packaging rating is required';
    }

    if (formData.ratingDelivery === 0) {
      errors.ratingDelivery = 'Delivery rating is required';
    }

    // If any rating is below 3, issue tags are required
    if (
      (formData.ratingQuality < 3 || formData.ratingPackaging < 3 || formData.ratingDelivery < 3) &&
      formData.issueTags.length === 0
    ) {
      errors.issueTags = 'At least one issue tag is required when any rating is below 3';
    }

    if (formData.clientRemarks.length > 500) {
      errors.clientRemarks = 'Remarks must not exceed 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the first product from the invoice
      const productId = dispatch.invoice.invoiceItems[0]?.finishedGood?.id || 'unknown';

      await api.post('/api/feedback', {
        dispatchId: dispatch.id,
        clientId: dispatch.invoice.client.id,
        productId,
        ratingQuality: formData.ratingQuality,
        ratingPackaging: formData.ratingPackaging,
        ratingDelivery: formData.ratingDelivery,
        clientRemarks: formData.clientRemarks,
        issueTags: formData.issueTags
      });

      setOpen(false);
      onSubmit();
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (field: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(field, star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={star <= currentRating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  const hasLowRating = formData.ratingQuality < 3 || formData.ratingPackaging < 3 || formData.ratingDelivery < 3;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1A1C22] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Client Feedback</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Dispatch Summary */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50 dark:bg-[#282C35] dark:border-gray-600">
          <h3 className="font-semibold mb-2 dark:text-white">Dispatch Details</h3>
          <div className="space-y-1 text-sm">
            <p className="dark:text-gray-300">
              <span className="font-medium">Client:</span> {dispatch.invoice.client.name}
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">Invoice:</span> {dispatch.invoice.invoiceNumber}
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">AWB:</span> {dispatch.awbNumber}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Product Quality Rating */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Product Quality <span className="text-red-500">*</span>
            </label>
            {renderStarRating('ratingQuality', formData.ratingQuality)}
            {formData.ratingQuality > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formData.ratingQuality}/5 stars
              </p>
            )}
            {validationErrors.ratingQuality && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.ratingQuality}</p>
            )}
          </div>

          {/* Packaging Rating */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Packaging Quality <span className="text-red-500">*</span>
            </label>
            {renderStarRating('ratingPackaging', formData.ratingPackaging)}
            {formData.ratingPackaging > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formData.ratingPackaging}/5 stars
              </p>
            )}
            {validationErrors.ratingPackaging && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.ratingPackaging}</p>
            )}
          </div>

          {/* Delivery Rating */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Delivery Experience <span className="text-red-500">*</span>
            </label>
            {renderStarRating('ratingDelivery', formData.ratingDelivery)}
            {formData.ratingDelivery > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formData.ratingDelivery}/5 stars
              </p>
            )}
            {validationErrors.ratingDelivery && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.ratingDelivery}</p>
            )}
          </div>

          {/* Issue Tags */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Issue Tags {hasLowRating && <span className="text-red-500">*</span>}
            </label>
            {hasLowRating && (
              <p className="text-xs text-orange-600 mb-2">
                Required when any rating is below 3 stars
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_TAG_OPTIONS.map(tag => (
                <label
                  key={tag}
                  className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-[#282C35]"
                >
                  <input
                    type="checkbox"
                    checked={formData.issueTags.includes(tag)}
                    onChange={() => handleIssueTagToggle(tag)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm dark:text-white">{tag}</span>
                </label>
              ))}
            </div>
            {validationErrors.issueTags && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.issueTags}</p>
            )}
          </div>

          {/* Client Remarks */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">
              Client Remarks (Optional)
            </label>
            <textarea
              value={formData.clientRemarks}
              onChange={(e) => setFormData(prev => ({ ...prev, clientRemarks: e.target.value }))}
              placeholder="Any additional comments or feedback..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-[#282C35] dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.clientRemarks.length}/500 characters
            </p>
            {validationErrors.clientRemarks && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.clientRemarks}</p>
            )}
          </div>

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
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;

