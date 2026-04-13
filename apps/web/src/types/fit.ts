export interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price?: number;
  duration?: string;
  features?: string[];
  category: 'class' | 'training' | 'membership' | 'amenity' | 'other';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'supplements' | 'apparel' | 'equipment' | 'accessories' | 'other';
  inStock: boolean;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: string;
}