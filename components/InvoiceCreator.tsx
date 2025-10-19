
import React, { useState, useMemo } from 'react';
import { Product, LineItem, Document, DocumentType } from '../types';

interface Props {
  products: Product[];
  saveDocument: (doc: Omit<Document, 'id' | 'number' | 'date'>) => void;
}

const GST_RATE = 0.18;

const InvoiceCreator: React.FC<Props> = ({ products, saveDocument }) => {
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const availableProducts = products.filter(p => p.stock > 0);

  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [lineItems]);
  
  const gstAmount = useMemo(() => subtotal * GST_RATE, [subtotal]);
  const total = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product || quantity <= 0) return;

    // Check if item already exists
    const existingItemIndex = lineItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
        // Update quantity
        const updatedItems = [...lineItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setLineItems(updatedItems);
    } else {
        // Add new item
        setLineItems([...lineItems, { productId: product.id, name: product.name, price: product.price, quantity }]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };
  
  const handleRemoveItem = (productId: string) => {
    setLineItems(lineItems.filter(item => item.productId !== productId));
  };

  const handleSave = (type: DocumentType) => {
    if (!clientName || lineItems.length === 0) {
      alert("Please fill in client name and add at least one item.");
      return;
    }
    saveDocument({ type, clientName, clientAddress, items: lineItems, subtotal, gstAmount, total });
    // Reset form
    setClientName('');
    setClientAddress('');
    setLineItems([]);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Document</h2>
      
      {/* Client Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
          <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">Client Address</label>
          <textarea id="clientAddress" value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      {/* Item Adder */}
      <div className="bg-gray-50 p-4 rounded-md mb-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product</label>
                <select id="product" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option value="" disabled>Select a product</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button onClick={handleAddItem} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Add Item</button>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Product</th>
                <th scope="col" className="px-6 py-3 text-right">Price</th>
                <th scope="col" className="px-6 py-3 text-right">Quantity</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <tr key={item.productId} className="bg-white border-b">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700">&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full md:w-1/3">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GST (18%):</span> <span>₹{gstAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg"><span className="text-gray-800">Total:</span> <span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-end space-x-4">
        <button onClick={() => handleSave(DocumentType.Estimate)} className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">Save as Estimate</button>
        <button onClick={() => handleSave(DocumentType.Invoice)} className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">Save as Invoice</button>
      </div>
    </div>
  );
};

export default InvoiceCreator;
