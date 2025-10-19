// --- App State & Local Storage ---

const storage = {
  get: (key, defaultValue) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let state = {
  products: storage.get('bhagya-products', []),
  documents: storage.get('bhagya-documents', []),
  view: 'create', // 'create' | 'list' | 'inventory' | 'view'
  selectedDocumentId: null,
  editingProductId: null,
  invoiceCounter: storage.get('bhagya-invoice-counter', 1),
  estimateCounter: storage.get('bhagya-estimate-counter', 1),
  // State for the document creator form
  creator: {
    clientName: '',
    clientAddress: '',
    lineItems: [],
  }
};

// --- DOM Elements ---
const appContainer = document.getElementById('app-container');
const navContainer = document.querySelector('nav');

// --- Constants ---
const GST_RATE = 0.18;
const DocumentType = {
  Invoice: 'Invoice',
  Estimate: 'Estimate',
};


// --- State Management & Rendering ---

function setState(newState) {
  state = { ...state, ...newState };
  render();
  // Persist important state
  storage.set('bhagya-products', state.products);
  storage.set('bhagya-documents', state.documents);
  storage.set('bhagya-invoice-counter', state.invoiceCounter);
  storage.set('bhagya-estimate-counter', state.estimateCounter);
}

function render() {
  updateNavButtons();
  switch (state.view) {
    case 'inventory':
      appContainer.innerHTML = renderInventoryView();
      break;
    case 'create':
      appContainer.innerHTML = renderCreatorView();
      break;
    case 'list':
      appContainer.innerHTML = renderDocumentListView();
      break;
    case 'view':
      appContainer.innerHTML = renderDocumentViewerView();
      break;
    default:
      appContainer.innerHTML = renderCreatorView();
  }
}

function updateNavButtons() {
    navContainer.querySelectorAll('.nav-button').forEach(button => {
        if (button.dataset.view === state.view) {
            button.classList.add('bg-blue-600', 'text-white');
            button.classList.remove('text-gray-600', 'hover:bg-gray-200');
        } else {
            button.classList.remove('bg-blue-600', 'text-white');
            button.classList.add('text-gray-600', 'hover:bg-gray-200');
        }
    });
}

// --- Render Functions (Templates) ---

function renderInventoryView() {
  const editingProduct = state.products.find(p => p.id === state.editingProductId);
  const productsListHtml = state.products.length > 0 ? state.products.map(p => `
    <tr class="bg-white border-b hover:bg-gray-50">
      <td class="px-6 py-4 font-medium text-gray-900">${p.name}</td>
      <td class="px-6 py-4">₹${p.price.toFixed(2)}</td>
      <td class="px-6 py-4">${p.stock}</td>
      <td class="px-6 py-4 space-x-2">
        <button data-action="edit-product" data-id="${p.id}" class="font-medium text-blue-600 hover:underline">Edit</button>
        <button data-action="delete-product" data-id="${p.id}" class="font-medium text-red-600 hover:underline">Delete</button>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="4" class="text-center py-4">No products added yet.</td></tr>`;

  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">${editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form id="product-form" class="space-y-4">
            <input type="hidden" name="id" value="${editingProduct?.id || ''}">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" id="name" name="name" value="${editingProduct?.name || ''}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label for="price" class="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input type="number" id="price" name="price" value="${editingProduct?.price || ''}" min="0" step="0.01" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label for="stock" class="block text-sm font-medium text-gray-700">Stock Quantity</label>
              <input type="number" id="stock" name="stock" value="${editingProduct?.stock || ''}" min="0" step="1" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div class="flex space-x-2">
                <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    ${editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                ${editingProduct ? `<button type="button" data-action="cancel-edit-product" class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>` : ''}
            </div>
          </form>
        </div>
      </div>
      <div class="md:col-span-2 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Product List</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3">Name</th>
                <th scope="col" class="px-6 py-3">Price</th>
                <th scope="col" class="px-6 py-3">Stock</th>
                <th scope="col" class="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>${productsListHtml}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCreatorView() {
  const { clientName, clientAddress, lineItems } = state.creator;
  const availableProducts = state.products.filter(p => p.stock > 0);

  const subtotal = lineItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = subtotal * GST_RATE;
  const total = subtotal + gstAmount;

  return `
    <div class="bg-white p-8 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Create New Document</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label for="clientName" class="block text-sm font-medium text-gray-700">Client Name</label>
          <input type="text" id="clientName" value="${clientName}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label for="clientAddress" class="block text-sm font-medium text-gray-700">Client Address</label>
          <textarea id="clientAddress" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">${clientAddress}</textarea>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-md mb-6 border">
        <form id="add-item-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div class="md:col-span-2">
                <label for="product" class="block text-sm font-medium text-gray-700">Product</label>
                <select id="product" name="productId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option value="" disabled selected>Select a product</option>
                    ${availableProducts.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('')}
                </select>
            </div>
            <div>
                <label for="quantity" class="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" id="quantity" name="quantity" value="1" min="1" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Add Item</button>
        </form>
      </div>

      <div class="mb-6 overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3">Product</th>
                <th scope="col" class="px-6 py-3 text-right">Price</th>
                <th scope="col" class="px-6 py-3 text-right">Quantity</th>
                <th scope="col" class="px-6 py-3 text-right">Total</th>
                <th scope="col" class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map(item => `
                <tr key="${item.productId}" class="bg-white border-b">
                  <td class="px-6 py-4 font-medium text-gray-900">${item.name}</td>
                  <td class="px-6 py-4 text-right">₹${item.price.toFixed(2)}</td>
                  <td class="px-6 py-4 text-right">${item.quantity}</td>
                  <td class="px-6 py-4 text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
                  <td class="px-6 py-4 text-right">
                    <button data-action="remove-line-item" data-id="${item.productId}" class="text-red-500 hover:text-red-700">&times;</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
        </table>
      </div>

      <div class="flex justify-end">
        <div class="w-full md:w-1/3">
          <div class="space-y-2">
            <div class="flex justify-between"><span class="text-gray-600">Subtotal:</span> <span>₹${subtotal.toFixed(2)}</span></div>
            <div class="flex justify-between"><span class="text-gray-600">GST (18%):</span> <span>₹${gstAmount.toFixed(2)}</span></div>
            <div class="flex justify-between border-t pt-2 mt-2 font-bold text-lg"><span class="text-gray-800">Total:</span> <span>₹${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 flex justify-end space-x-4">
        <button data-action="save-document" data-type="${DocumentType.Estimate}" class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">Save as Estimate</button>
        <button data-action="save-document" data-type="${DocumentType.Invoice}" class="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">Save as Invoice</button>
      </div>
    </div>
  `;
}

function renderDocumentListView() {
    return `
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Saved Documents</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3">Number</th>
              <th scope="col" class="px-6 py-3">Type</th>
              <th scope="col" class="px-6 py-3">Client</th>
              <th scope="col" class="px-6 py-3">Date</th>
              <th scope="col" class="px-6 py-3 text-right">Amount</th>
              <th scope="col" class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            ${state.documents.length > 0 ? state.documents.map(doc => `
              <tr key="${doc.id}" class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${doc.number}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${doc.type === 'Invoice' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${doc.type}
                  </span>
                </td>
                <td class="px-6 py-4">${doc.clientName}</td>
                <td class="px-6 py-4">${doc.date}</td>
                <td class="px-6 py-4 text-right">₹${doc.total.toFixed(2)}</td>
                <td class="px-6 py-4 text-right">
                  <button data-action="view-document" data-id="${doc.id}" class="font-medium text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="6" class="text-center py-4">No documents saved yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDocumentViewerView() {
    const doc = state.documents.find(d => d.id === state.selectedDocumentId);
    if (!doc) return `<p>Document not found.</p><button data-action="back-to-list">Back</button>`;

    return `
    <div>
      <div class="flex justify-between items-center mb-6 no-print">
        <button data-action="back-to-list" class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">
          &larr; Back to List
        </button>
        <div>
          <button data-action="print-doc" class="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 mr-2">
            Print
          </button>
          <button data-action="download-pdf" class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Download PDF
          </button>
        </div>
      </div>

      <div id="document-content" class="bg-white p-12 shadow-lg rounded-sm max-w-4xl mx-auto">
        <header class="flex justify-between items-start pb-8 border-b">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Bhagya Groups</h1>
            <p class="text-gray-500">123 Business Road, Commerce City, 12345</p>
          </div>
          <div class="text-right">
            <h2 class="text-3xl font-bold uppercase text-gray-600">${doc.type}</h2>
            <p class="text-gray-500"><span class="font-semibold">#</span>${doc.number}</p>
          </div>
        </header>

        <section class="grid grid-cols-2 gap-8 my-8">
          <div>
            <h3 class="text-sm font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
            <p class="font-bold text-gray-800">${doc.clientName}</p>
            <p class="text-gray-600 whitespace-pre-line">${doc.clientAddress}</p>
          </div>
          <div class="text-right">
            <p class="text-gray-500"><span class="font-semibold">Date:</span> ${new Date(doc.date).toLocaleDateString()}</p>
          </div>
        </section>

        <section class="mb-8">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 border-b border-t">
              <tr>
                <th class="text-left font-semibold text-gray-600 p-3">Item</th>
                <th class="text-right font-semibold text-gray-600 p-3">Price</th>
                <th class="text-center font-semibold text-gray-600 p-3">Qty</th>
                <th class="text-right font-semibold text-gray-600 p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              ${doc.items.map(item => `
                <tr key="${item.productId}" class="border-b">
                  <td class="p-3">${item.name}</td>
                  <td class="text-right p-3">₹${item.price.toFixed(2)}</td>
                  <td class="text-center p-3">${item.quantity}</td>
                  <td class="text-right p-3">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <section class="flex justify-end">
          <div class="w-1/2">
            <div class="space-y-2">
              <div class="flex justify-between text-gray-600"><p>Subtotal</p><p>₹${doc.subtotal.toFixed(2)}</p></div>
              <div class="flex justify-between text-gray-600"><p>GST (18%)</p><p>₹${doc.gstAmount.toFixed(2)}</p></div>
              <div class="flex justify-between font-bold text-xl text-gray-800 bg-gray-100 p-3 rounded-md">
                <p>Grand Total</p><p>₹${doc.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        <footer class="mt-16 pt-8 border-t text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </footer>
      </div>
    </div>
    `;
}

// --- Event Handlers & Actions ---

function handleNavClick(e) {
  const view = e.target.dataset.view;
  if (view) {
    setState({ view });
  }
}

function handleForm(form, handler) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    handler(data);
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  handleForm(e.target, (data) => {
    const productData = {
        name: data.name,
        price: parseFloat(data.price),
        stock: parseInt(data.stock, 10),
    };

    if (state.editingProductId) {
        // Update product
        const updatedProducts = state.products.map(p =>
            p.id === state.editingProductId ? { ...p, ...productData } : p
        );
        setState({ products: updatedProducts, editingProductId: null });
    } else {
        // Add new product
        const newProduct = { ...productData, id: `prod_${Date.now()}` };
        setState({ products: [...state.products, newProduct] });
    }
  });
}

function handleAddItemFormSubmit(e) {
    e.preventDefault();
    handleForm(e.target, (data) => {
        const product = state.products.find(p => p.id === data.productId);
        const quantity = parseInt(data.quantity, 10);
        if (!product || !quantity || quantity <= 0) return;

        let lineItems = [...state.creator.lineItems];
        const existingItemIndex = lineItems.findIndex(item => item.productId === product.id);

        if (existingItemIndex > -1) {
            lineItems[existingItemIndex].quantity += quantity;
        } else {
            lineItems.push({ productId: product.id, name: product.name, price: product.price, quantity });
        }
        
        setState({ creator: { ...state.creator, lineItems } });
        e.target.reset();
    });
}

function saveDocument(type) {
    const { clientName, clientAddress, lineItems } = state.creator;
    if (!clientName || lineItems.length === 0) {
      alert("Please fill in client name and add at least one item.");
      return;
    }
    const subtotal = lineItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const gstAmount = subtotal * GST_RATE;
    const total = subtotal + gstAmount;

    let invoiceCounter = state.invoiceCounter;
    let estimateCounter = state.estimateCounter;
    let number;
    if (type === DocumentType.Invoice) {
        number = `INV-${String(invoiceCounter).padStart(4, '0')}`;
        invoiceCounter++;
    } else {
        number = `EST-${String(estimateCounter).padStart(4, '0')}`;
        estimateCounter++;
    }
    
    const newDocument = {
        id: `doc_${Date.now()}`,
        type,
        number,
        clientName,
        clientAddress,
        items: lineItems,
        subtotal,
        gstAmount,
        total,
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    };

    const documents = [newDocument, ...state.documents];
    let products = state.products;

    if (type === DocumentType.Invoice) {
        products = state.products.map(p => {
            const item = lineItems.find(li => li.productId === p.id);
            if (item) {
                return { ...p, stock: p.stock - item.quantity };
            }
            return p;
        });
    }

    setState({
        documents,
        products,
        invoiceCounter,
        estimateCounter,
        view: 'list',
        creator: { clientName: '', clientAddress: '', lineItems: [] }
    });
}

function downloadPDF() {
    const doc = state.documents.find(d => d.id === state.selectedDocumentId);
    const input = document.getElementById('document-content');
    if (input && doc) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
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
        pdf.save(`${doc.number}.pdf`);
      });
    }
}

// Global Event Listener using Delegation
document.addEventListener('submit', (e) => {
    if (e.target.id === 'product-form') {
        handleProductFormSubmit(e);
    } else if (e.target.id === 'add-item-form') {
        handleAddItemFormSubmit(e);
    }
});

document.addEventListener('click', (e) => {
    const { action, id, type } = e.target.dataset;
    if (!action) return;

    switch(action) {
        case 'edit-product':
            setState({ editingProductId: id });
            break;
        case 'delete-product':
            if (confirm('Are you sure you want to delete this product?')) {
                const products = state.products.filter(p => p.id !== id);
                setState({ products, editingProductId: state.editingProductId === id ? null : state.editingProductId });
            }
            break;
        case 'cancel-edit-product':
            setState({ editingProductId: null });
            break;
        case 'remove-line-item': {
            const lineItems = state.creator.lineItems.filter(item => item.productId !== id);
            setState({ creator: { ...state.creator, lineItems } });
            break;
        }
        case 'save-document':
            saveDocument(type);
            break;
        case 'view-document':
            setState({ view: 'view', selectedDocumentId: id });
            break;
        case 'back-to-list':
            setState({ view: 'list', selectedDocumentId: null });
            break;
        case 'print-doc':
            window.print();
            break;
        case 'download-pdf':
            downloadPDF();
            break;
    }
});

document.addEventListener('input', (e) => {
    if (e.target.id === 'clientName') {
        state.creator.clientName = e.target.value;
    } else if (e.target.id === 'clientAddress') {
        state.creator.clientAddress = e.target.value;
    }
});


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', render);
