import { useState, useRef } from 'react';
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Webcam from 'react-webcam';
import api from '@/lib/api';

interface PhotoUploadProps {
  batchId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
}

const PhotoUpload = ({ batchId, setOpen, onSuccess }: PhotoUploadProps) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'camera'>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'quality_check' | 'general'>('before');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate file size and type
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 10MB)`);
          return false;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(`File ${file.name} is not a valid image format`);
          return false;
        }
        return true;
      });

      if (validFiles.length + selectedFiles.length > 10) {
        setError('Maximum 10 photos allowed');
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImages(prev => [...prev, imageSrc]);
        setShowWebcam(false);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeCapturedImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      
      // Add files
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      // Convert captured images to blobs and add them
      for (const imageData of capturedImages) {
        const blob = await fetch(imageData).then(r => r.blob());
        const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('photos', file);
      }

      formData.append('photoType', photoType);
      formData.append('notes', notes);

      await api.post(`/api/batches/${batchId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
      setOpen(false);
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      setError(err.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const totalPhotos = selectedFiles.length + capturedImages.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Upload Photos</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Upload Mode Toggle */}
          <div className="flex gap-4">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-semibold transition-all ${
                uploadMode === 'file'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              <Upload size={18} />
              File Upload
            </button>
            <button
              onClick={() => setUploadMode('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-semibold transition-all ${
                uploadMode === 'camera'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              <Camera size={18} />
              Camera Capture
            </button>
          </div>

          {/* File Upload Mode */}
          {uploadMode === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Click to select photos
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP up to 10MB (Max 10 photos)
                </p>
              </div>
            </div>
          )}

          {/* Camera Mode */}
          {uploadMode === 'camera' && (
            <div>
              {showWebcam ? (
                <div className="space-y-4">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-4">
                    <Button
                      onClick={handleCapture}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <Camera size={18} className="mr-2" />
                      Capture Photo
                    </Button>
                    <Button
                      onClick={() => setShowWebcam(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowWebcam(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Open Camera
                  </p>
                  <p className="text-sm text-gray-500">
                    Take photos using your device camera
                  </p>
                </button>
              )}
            </div>
          )}

          {/* Selected Photos Preview */}
          {totalPhotos > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Selected Photos ({totalPhotos})</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={`file-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
                {capturedImages.map((img, index) => (
                  <div key={`captured-${index}`} className="relative group">
                    <img
                      src={img}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => removeCapturedImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-xs text-gray-600 mt-1">Captured</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Photo Type *</label>
            <select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value as any)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="before">Before Packaging</option>
              <option value="after">After Packaging</option>
              <option value="quality_check">Quality Check</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
              placeholder="Add notes about these photos..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={totalPhotos === 0 || uploading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${totalPhotos} Photo${totalPhotos !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;

