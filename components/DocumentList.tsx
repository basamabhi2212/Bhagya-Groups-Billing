
import React from 'react';
import { Document } from '../types';

interface Props {
  documents: Document[];
  viewDocument: (doc: Document) => void;
}

const DocumentList: React.FC<Props> = ({ documents, viewDocument }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Saved Documents</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Number</th>
              <th scope="col" className="px-6 py-3">Type</th>
              <th scope="col" className="px-6 py-3">Client</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3 text-right">Amount</th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? documents.map(doc => (
              <tr key={doc.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{doc.number}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.type === 'Invoice' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4">{doc.clientName}</td>
                <td className="px-6 py-4">{doc.date}</td>
                <td className="px-6 py-4 text-right">₹{doc.total.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewDocument(doc)} className="font-medium text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="text-center py-4">No documents saved yet.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;
