import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface ClientDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  contactPerson: string;
  creditLimit: number;
  paymentTerms: string;
  isActive: boolean;
}

interface Feedback {
  id: string;
  feedbackDate: string;
  ratingQuality: number;
  ratingPackaging: number;
  ratingDelivery: number;
  clientRemarks: string;
  issueTags: string[];
  dispatch: {
    courierName: string;
    invoice: {
      invoiceNumber: string;
    };
  };
}

interface FeedbackData {
  feedbacks: Feedback[];
  averages: {
    overall: number;
    quality: number;
    packaging: number;
    delivery: number;
  };
  issueCounts: { [key: string]: number };
  totalFeedbacks: number;
}

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'feedback'>('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchClientFeedback();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/clients/${id}`);
      setClient(response.data.client);
    } catch (err: any) {
      console.error('Error fetching client:', err);
      setError(err.response?.data?.error || 'Failed to fetch client');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientFeedback = async () => {
    try {
      const response = await api.get(`/api/feedback/client/${id}`);
      setFeedbackData(response.data);
    } catch (err: any) {
      console.error('Error fetching feedback:', err);
    }
  };

  const renderStarRating = (rating: number, showNumber: boolean = true) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
              ★
            </span>
          ))}
        </div>
        {showNumber && <span className="text-sm font-semibold">{rating}/5</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading client details...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || 'Client not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-gray-500">Client Details</p>
          </div>
        </div>
        <Badge className={`border ${
          client.isActive
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-red-100 text-red-700 border-red-300'
        }`}>
          {client.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <User size={16} />
            Client Info
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText size={16} />
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
              activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageSquare size={16} />
            Feedback Dashboard
            {feedbackData && feedbackData.totalFeedbacks > 0 && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                {feedbackData.totalFeedbacks}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">{client.name}</p>
              </div>
              {client.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{client.email}</p>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{client.phone}</p>
                </div>
              )}
              {client.contactPerson && (
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p>{client.contactPerson}</p>
                </div>
              )}
              {client.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{client.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Business Information</h2>
            <div className="space-y-3">
              {client.gstNumber && (
                <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="font-mono">{client.gstNumber}</p>
                </div>
              )}
              {client.panNumber && (
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-mono">{client.panNumber}</p>
                </div>
              )}
              {client.creditLimit !== null && (
                <div>
                  <p className="text-sm text-gray-500">Credit Limit</p>
                  <p className="font-semibold">₹{client.creditLimit.toFixed(2)}</p>
                </div>
              )}
              {client.paymentTerms && (
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p>{client.paymentTerms}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Invoices</h2>
          <p className="text-gray-500 text-sm">Invoice list will be displayed here.</p>
          <p className="text-xs text-gray-400 mt-2">
            Navigate to the Invoices page and filter by client name to view all invoices.
          </p>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {!feedbackData || feedbackData.totalFeedbacks === 0 ? (
            <div className="border border-gray-300 rounded-lg p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No feedback available for this client yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Feedback will appear here once deliveries are completed and feedback is submitted.
              </p>
            </div>
          ) : (
            <>
              {/* Average Ratings Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-gray-300 rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} className="text-blue-600" />
                    <p className="text-sm text-gray-600 font-medium">Overall Average</p>
                  </div>
                  {renderStarRating(Math.round(Number(feedbackData.averages.overall)))}
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {Number(feedbackData.averages.overall).toFixed(2)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-2">Product Quality</p>
                  {renderStarRating(Math.round(Number(feedbackData.averages.quality)))}
                  <p className="text-2xl font-bold mt-2">
                    {Number(feedbackData.averages.quality).toFixed(2)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-2">Packaging</p>
                  {renderStarRating(Math.round(Number(feedbackData.averages.packaging)))}
                  <p className="text-2xl font-bold mt-2">
                    {Number(feedbackData.averages.packaging).toFixed(2)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-2">Delivery</p>
                  {renderStarRating(Math.round(Number(feedbackData.averages.delivery)))}
                  <p className="text-2xl font-bold mt-2">
                    {Number(feedbackData.averages.delivery).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Issue Summary Card */}
              {Object.keys(feedbackData.issueCounts).length > 0 && (
                <div className="border border-gray-300 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Issue Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(feedbackData.issueCounts).map(([issue, count]) => (
                      <div key={issue} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                        <span className="text-sm font-medium text-red-800">{issue}</span>
                        <Badge className="bg-red-600 text-white">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feedback List */}
              <div className="border border-gray-300 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Feedback</h2>
                  <p className="text-sm text-gray-500">
                    {feedbackData.totalFeedbacks} total feedback{feedbackData.totalFeedbacks !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2">
                      <tr>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Invoice</th>
                        <th className="text-left p-3">Quality</th>
                        <th className="text-left p-3">Packaging</th>
                        <th className="text-left p-3">Delivery</th>
                        <th className="text-left p-3">Issues</th>
                        <th className="text-left p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackData.feedbacks.slice(0, 5).map((feedback) => (
                        <tr key={feedback.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            {new Date(feedback.feedbackDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {feedback.dispatch.invoice.invoiceNumber}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              <span>{feedback.ratingQuality}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              <span>{feedback.ratingPackaging}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              <span>{feedback.ratingDelivery}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {feedback.issueTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {feedback.issueTags.slice(0, 2).map((tag, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-red-100 text-red-700 text-xs border border-red-300"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {feedback.issueTags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{feedback.issueTags.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                          </td>
                          <td className="p-3">
                            {feedback.clientRemarks ? (
                              <p className="text-xs text-gray-600 truncate max-w-xs">
                                {feedback.clientRemarks}
                              </p>
                            ) : (
                              <span className="text-gray-400 text-xs">No remarks</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {feedbackData.feedbacks.length > 5 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Showing 5 of {feedbackData.totalFeedbacks} feedback entries
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDetailsPage;

