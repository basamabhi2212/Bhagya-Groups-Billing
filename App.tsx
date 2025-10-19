import React, { useState, useMemo, useRef } from 'react';

// Add declarations for CDN libraries to avoid TypeScript errors
declare const jspdf: any;
declare const html2canvas: any;

// =================================================================================
// TYPE DEFINITIONS (from types.ts)
// =================================================================================
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface LineItem {
  productId: string;
  name:string;
  price: number;
  quantity: number;
}

enum DocumentType {
  Invoice = 'Invoice',
  Estimate = 'Estimate',
}

interface Document {
  id: string;
  type: DocumentType;
  number: string;
  clientName: string;
  clientAddress: string;
  date: string;
  items: LineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
}


// =================================================================================
// COMPONENT: ProductManagement
// =================================================================================
interface ProductManagementProps {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, addProduct, updateProduct, deleteProduct }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price && stock) {
      if (editingProduct) {
        updateProduct({ ...editingProduct, name, price: parseFloat(price), stock: parseInt(stock, 10) });
        setEditingProduct(null);
      } else {
        addProduct({ name, price: parseFloat(price), stock: parseInt(stock, 10) });
      }
      setName('');
      setPrice('');
      setStock('');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
  };
  
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
              <input type="number" id="stock" value={stock} onChange={e => setStock(e.target.value)} min="0" step="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div className="flex space-x-2">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                {editingProduct && (
                    <button type="button" onClick={handleCancelEdit} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancel
                    </button>
                )}
            </div>
          </form>
        </div>
      </div>

      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Product List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Price</th>
                <th scope="col" className="px-6 py-3">Stock</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4">₹{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(product)} className="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteProduct(product.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={4} className="text-center py-4">No products added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// =================================================================================
// COMPONENT: InvoiceCreator
// =================================================================================
interface InvoiceCreatorProps {
  products: Product[];
  saveDocument: (doc: Omit<Document, 'id' | 'number' | 'date'>) => void;
}

const GST_RATE = 0.18;

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ products, saveDocument }) => {
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

    const existingItemIndex = lineItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
        const updatedItems = [...lineItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setLineItems(updatedItems);
    } else {
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
    setClientName('');
    setClientAddress('');
    setLineItems([]);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Document</h2>
      
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

      <div className="flex justify-end">
        <div className="w-full md:w-1/3">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GST (18%):</span> <span>₹{gstAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg"><span className="text-gray-800">Total:</span> <span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-4">
        <button onClick={() => handleSave(DocumentType.Estimate)} className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">Save as Estimate</button>
        <button onClick={() => handleSave(DocumentType.Invoice)} className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">Save as Invoice</button>
      </div>
    </div>
  );
};


// =================================================================================
// COMPONENT: DocumentList
// =================================================================================
interface DocumentListProps {
  documents: Document[];
  viewDocument: (doc: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, viewDocument }) => {
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


// =================================================================================
// COMPONENT: DocumentViewer
// =================================================================================
interface DocumentViewerProps {
  document: Document;
  onBack: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onBack }) => {
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


// =================================================================================
// LOCAL STORAGE HOOK
// =================================================================================
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}


// =================================================================================
// MAIN APP COMPONENT
// =================================================================================
type View = 'inventory' | 'create' | 'list' | 'view';

const App: React.FC = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('bhagya-products', []);
  const [documents, setDocuments] = useLocalStorage<Document[]>('bhagya-documents', []);
  const [view, setView] = useState<View>('create');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const [invoiceCounter, setInvoiceCounter] = useLocalStorage('bhagya-invoice-counter', 1);
  const [estimateCounter, setEstimateCounter] = useLocalStorage('bhagya-estimate-counter', 1);

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: `prod_${Date.now()}` }]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };
  
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }

  const generateDocumentNumber = (type: DocumentType) => {
    if (type === DocumentType.Invoice) {
      const num = `INV-${String(invoiceCounter).padStart(4, '0')}`;
      setInvoiceCounter(invoiceCounter + 1);
      return num;
    } else {
      const num = `EST-${String(estimateCounter).padStart(4, '0')}`;
      setEstimateCounter(estimateCounter + 1);
      return num;
    }
  };

  const saveDocument = (doc: Omit<Document, 'id' | 'number' | 'date'>) => {
    const newDocument: Document = {
      ...doc,
      id: `doc_${Date.now()}`,
      number: generateDocumentNumber(doc.type),
      date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    };
    setDocuments(prev => [newDocument, ...prev]);

    if (newDocument.type === DocumentType.Invoice) {
      setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        newDocument.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex].stock -= item.quantity;
          }
        });
        return updatedProducts;
      });
    }

    setView('list');
  };

  const viewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setView('view');
  };

  const renderView = () => {
    switch (view) {
      case 'inventory':
        return <ProductManagement products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />;
      case 'create':
        return <InvoiceCreator products={products} saveDocument={saveDocument} />;
      case 'list':
        return <DocumentList documents={documents} viewDocument={viewDocument} />;
      case 'view':
        return selectedDocument ? <DocumentViewer document={selectedDocument} onBack={() => setView('list')} /> : <p>No document selected.</p>;
      default:
        return <InvoiceCreator products={products} saveDocument={saveDocument} />;
    }
  };
  
  const NavButton: React.FC<{ current: View, target: View, onClick: () => void, children: React.ReactNode }> = ({ current, target, onClick, children }) => {
    const isActive = current === target;
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {children}
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white shadow-md no-print">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">Bhagya Groups</h1>
          <nav className="flex items-center space-x-2">
             <NavButton current={view} target="create" onClick={() => setView('create')}>Create Document</NavButton>
             <NavButton current={view} target="list" onClick={() => setView('list')}>Saved Documents</NavButton>
             <NavButton current={view} target="inventory" onClick={() => setView('inventory')}>Inventory</NavButton>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
