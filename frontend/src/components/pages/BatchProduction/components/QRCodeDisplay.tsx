import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  batchCode: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const QRCodeDisplay = ({ batchCode, setOpen }: QRCodeDisplayProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow && qrRef.current) {
      const qrSvg = qrRef.current.querySelector('svg');
      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Code - ${batchCode}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                }
                h1 {
                  margin: 20px 0;
                  font-size: 24px;
                }
                .qr-code {
                  border: 2px solid #000;
                  padding: 20px;
                }
                .batch-code {
                  margin-top: 20px;
                  font-family: monospace;
                  font-size: 18px;
                  font-weight: bold;
                }
                @media print {
                  body {
                    padding: 20px;
                  }
                }
              </style>
            </head>
            <body>
              <h1>Batch QR Code</h1>
              <div class="qr-code">
                <img src="${dataUrl}" alt="QR Code" style="width: 400px; height: 400px;" />
              </div>
              <div class="batch-code">${batchCode}</div>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDownload = () => {
    if (qrRef.current) {
      const qrSvg = qrRef.current.querySelector('svg');
      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.download = `batch-qr-${batchCode}.svg`;
        link.href = svgUrl;
        link.click();
        URL.revokeObjectURL(svgUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
        <div className="border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Batch QR Code</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center space-y-6">
            {/* QR Code */}
            <div ref={qrRef} className="flex justify-center">
              <div className="p-6 bg-white border-4 border-gray-300 rounded-lg shadow-lg">
                <QRCodeSVG value={batchCode} size={300} level="H" />
              </div>
            </div>

            {/* Batch Code */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Batch Code</p>
              <p className="text-2xl font-mono font-bold">{batchCode}</p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800">
                <strong>Usage Instructions:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Scan this QR code to quickly access batch details</li>
                <li>Attach to product packaging for traceability</li>
                <li>Use for quality control and inventory management</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer size={18} />
                Print QR Code
              </Button>
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
              >
                <Download size={18} />
                Download SVG
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

