import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import StatusUpdateModal from './StatusUpdateModal';
import FeedbackForm from '@/components/Forms/FeedbackForm';

interface DispatchDetails {
  id: string;
  courierName: string;
  awbNumber: string;
  dispatchDate: string;
  status: 'Ready' | 'InTransit' | 'Delivered';
  createdAt: string;
  updatedAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentStatus: string;
    client: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    invoiceItems: Array<{
      finishedGood: {
        productName: string;
      };
    }>;
  };
  feedback?: {
    id: string;
    ratingQuality: number;
    ratingPackaging: number;
    ratingDelivery: number;
    clientRemarks: string;
    issueTags: string[];
    feedbackDate: string;
  };
}

const DispatchDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<DispatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDispatchDetails();
    }
  }, [id]);

  const fetchDispatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/dispatches/${id}`);
      setDispatch(response.data.dispatch);
    } catch (err: any) {
      console.error('Error fetching dispatch:', err);
      setError(err.response?.data?.error || 'Failed to fetch dispatch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Ready: 'bg-blue-100 text-blue-700 border-blue-300',
      InTransit: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Delivered: 'bg-green-100 text-green-700 border-green-300'
    };

    const labels = {
      Ready: 'Ready',
      InTransit: 'In Transit',
      Delivered: 'Delivered'
    };

    return (
      <Badge className={`border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    const iconClass = isActive ? 'text-blue-500' : 'text-gray-300';
    
    switch (status) {
      case 'Ready':
        return <Package className={iconClass} size={24} />;
      case 'InTransit':
        return <Truck className={iconClass} size={24} />;
      case 'Delivered':
        return <CheckCircle className={iconClass} size={24} />;
      default:
        return null;
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Loading dispatch details...</p>
      </div>
    );
  }

  if (error || !dispatch) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || 'Dispatch not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const statusOrder = ['Ready', 'InTransit', 'Delivered'];
  const currentStatusIndex = statusOrder.indexOf(dispatch.status);

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
            <h1 className="text-2xl font-bold">Dispatch Details</h1>
            <p className="text-sm text-gray-500">AWB: {dispatch.awbNumber}</p>
          </div>
        </div>
        <div>{getStatusBadge(dispatch.status)}</div>
      </div>

      {/* Status Timeline */}
      <div className="border border-gray-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Dispatch Timeline</h2>
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {statusOrder.map((status, index) => (
            <div key={status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full p-3 ${
                    index <= currentStatusIndex ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  {getStatusIcon(status, index <= currentStatusIndex)}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  index <= currentStatusIndex ? 'text-blue-700' : 'text-gray-400'
                }`}>
                  {status === 'InTransit' ? 'In Transit' : status}
                </p>
                {index === currentStatusIndex && (
                  <p className="text-xs text-gray-500 mt-1">Current</p>
                )}
              </div>
              {index < statusOrder.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    index < currentStatusIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Status Update Button */}
        {dispatch.status !== 'Delivered' && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setShowStatusModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Update Status
            </Button>
          </div>
        )}
      </div>

      {/* Dispatch Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Dispatch Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Courier Name</p>
              <p className="font-semibold">{dispatch.courierName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">AWB Number</p>
              <p className="font-mono font-semibold">{dispatch.awbNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dispatch Date</p>
              <p className="font-semibold">
                {new Date(dispatch.dispatchDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(dispatch.status)}
            </div>
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <button
                onClick={() => navigate(`/sales/invoices/${dispatch.invoice.id}`)}
                className="font-mono font-semibold text-blue-600 hover:underline"
              >
                {dispatch.invoice.invoiceNumber}
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-semibold">{dispatch.invoice.client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-semibold">₹{dispatch.invoice.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <Badge className={`border ${
                dispatch.invoice.paymentStatus === 'Paid'
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
              }`}>
                {dispatch.invoice.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details */}
      <div className="border border-gray-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Client Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-semibold">{dispatch.invoice.client.name}</p>
          </div>
          {dispatch.invoice.client.email && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{dispatch.invoice.client.email}</p>
            </div>
          )}
          {dispatch.invoice.client.phone && (
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p>{dispatch.invoice.client.phone}</p>
            </div>
          )}
          {dispatch.invoice.client.address && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p>{dispatch.invoice.client.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="border border-gray-300 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Products</h2>
        <div className="space-y-2">
          {dispatch.invoice.invoiceItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <Package size={16} className="text-gray-500" />
              <p className="text-sm">{item.finishedGood.productName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Client Feedback</h2>
          {dispatch.status === 'Delivered' && !dispatch.feedback && (
            <Button
              onClick={() => setShowFeedbackForm(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageSquare size={16} />
              Add Feedback
            </Button>
          )}
        </div>

        {dispatch.status !== 'Delivered' && (
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded text-gray-600">
            <AlertCircle size={20} />
            <p className="text-sm">Feedback can only be submitted after delivery is completed.</p>
          </div>
        )}

        {dispatch.status === 'Delivered' && !dispatch.feedback && (
          <div className="flex items-center gap-2 p-4 bg-orange-50 rounded text-orange-700">
            <AlertCircle size={20} />
            <p className="text-sm">Feedback has not been submitted yet. Click "Add Feedback" to submit.</p>
          </div>
        )}

        {dispatch.feedback && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Product Quality</p>
                {renderStarRating(dispatch.feedback.ratingQuality)}
                <p className="text-lg font-bold mt-1">{dispatch.feedback.ratingQuality}/5</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Packaging</p>
                {renderStarRating(dispatch.feedback.ratingPackaging)}
                <p className="text-lg font-bold mt-1">{dispatch.feedback.ratingPackaging}/5</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Delivery</p>
                {renderStarRating(dispatch.feedback.ratingDelivery)}
                <p className="text-lg font-bold mt-1">{dispatch.feedback.ratingDelivery}/5</p>
              </div>
            </div>

            {dispatch.feedback.issueTags && dispatch.feedback.issueTags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Issue Tags</p>
                <div className="flex flex-wrap gap-2">
                  {dispatch.feedback.issueTags.map((tag, index) => (
                    <Badge key={index} className="bg-red-100 text-red-700 border border-red-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {dispatch.feedback.clientRemarks && (
              <div>
                <p className="text-sm font-medium mb-2">Client Remarks</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm">{dispatch.feedback.clientRemarks}</p>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Submitted on: {new Date(dispatch.feedback.feedbackDate).toLocaleDateString('en-IN')}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStatusModal && (
        <StatusUpdateModal
          dispatch={dispatch}
          setOpen={setShowStatusModal}
          onUpdate={fetchDispatchDetails}
        />
      )}

      {showFeedbackForm && (
        <FeedbackForm
          dispatch={dispatch}
          setOpen={setShowFeedbackForm}
          onSubmit={fetchDispatchDetails}
        />
      )}
    </div>
  );
};

export default DispatchDetailsPage;

