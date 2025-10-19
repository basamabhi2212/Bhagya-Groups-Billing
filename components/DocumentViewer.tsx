
import React, { useRef } from 'react';
import { Document } from '../types';

// Add declarations for CDN libraries to avoid TypeScript errors
declare const jspdf: any;
declare const html2canvas: any;

interface Props {
  document: Document;
  onBack: () => void;
}

const DocumentViewer: React.FC<Props> = ({ document, onBack }) => {
  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const input = documentRef.current;
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas: any) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${document.number}.pdf`);
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={onBack} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">
          &larr; Back to List
        </button>
        <div>
          <button onClick={() => window.print()} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 mr-2">
            Print
          </button>
          <button onClick={handleDownloadPDF} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Download PDF
          </button>
        </div>
      </div>

      <div ref={documentRef} className="bg-white p-12 shadow-lg rounded-sm max-w-4xl mx-auto">
        <header className="flex justify-between items-start pb-8 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bhagya Groups</h1>
            <p className="text-gray-500">123 Business Road, Commerce City, 12345</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase text-gray-600">{document.type}</h2>
            <p className="text-gray-500"><span className="font-semibold">#</span>{document.number}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
            <p className="font-bold text-gray-800">{document.clientName}</p>
            <p className="text-gray-600 whitespace-pre-line">{document.clientAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500"><span className="font-semibold">Date:</span> {new Date(document.date).toLocaleDateString()}</p>
          </div>
        </section>

        <section className="mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-t">
              <tr>
                <th className="text-left font-semibold text-gray-600 p-3">Item</th>
                <th className="text-right font-semibold text-gray-600 p-3">Price</th>
                <th className="text-center font-semibold text-gray-600 p-3">Qty</th>
                <th className="text-right font-semibold text-gray-600 p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map(item => (
                <tr key={item.productId} className="border-b">
                  <td className="p-3">{item.name}</td>
                  <td className="text-right p-3">₹{item.price.toFixed(2)}</td>
                  <td className="text-center p-3">{item.quantity}</td>
                  <td className="text-right p-3">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end">
          <div className="w-1/2">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600"><p>Subtotal</p><p>₹{document.subtotal.toFixed(2)}</p></div>
              <div className="flex justify-between text-gray-600"><p>GST (18%)</p><p>₹{document.gstAmount.toFixed(2)}</p></div>
              <div className="flex justify-between font-bold text-xl text-gray-800 bg-gray-100 p-3 rounded-md">
                <p>Grand Total</p><p>₹{document.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </footer>
      </div>
    </div>
  );
};

export default DocumentViewer;
