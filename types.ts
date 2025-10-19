
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface LineItem {
  productId: string;
  name:string;
  price: number;
  quantity: number;
}

export enum DocumentType {
  Invoice = 'Invoice',
  Estimate = 'Estimate',
}

export interface Document {
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
