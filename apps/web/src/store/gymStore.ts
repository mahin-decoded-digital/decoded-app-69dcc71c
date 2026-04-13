import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { Service, Product, CartItem, Inquiry, Order } from '@/types/fit';

export interface GymState {
  services: Service[];
  products: Product[];
  cart: CartItem[];
  inquiries: Inquiry[];
  orders: Order[];

  loadAll: () => Promise<void>;

  // Cart Actions
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Inquiry Actions
  submitInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateInquiryStatus: (id: string, status: Inquiry['status']) => Promise<void>;

  // Order Actions
  placeOrder: (customerDetails: { customerName: string; customerEmail: string; shippingAddress: string }) => Promise<string>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;

  // Catalog Management (Admin)
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useGymStore = create<GymState>()((set, get) => ({
  services: [],
  products: [],
  cart: [],
  inquiries: [],
  orders: [],

  loadAll: async () => {
    try {
      const [services, products, cart, inquiries, orders] = await Promise.all([
        fetch(apiUrl('/api/services')).then(r => r.json()),
        fetch(apiUrl('/api/products')).then(r => r.json()),
        fetch(apiUrl('/api/cart')).then(r => r.json()),
        fetch(apiUrl('/api/inquiries')).then(r => r.json()),
        fetch(apiUrl('/api/orders')).then(r => r.json()),
      ]);
      set({ 
        services: Array.isArray(services) ? services : [], 
        products: Array.isArray(products) ? products : [], 
        cart: Array.isArray(cart) ? cart : [], 
        inquiries: Array.isArray(inquiries) ? inquiries : [], 
        orders: Array.isArray(orders) ? orders : []
      });
    } catch (err) {
      console.error(err);
    }
  },

  addToCart: async (product, quantity = 1) => {
    const { cart } = get();
    // In db, it might be _id
    const pid = (product as any)._id || product.id;
    const existingItem = cart.find(item => ((item.product as any)._id || item.product.id) === pid);
    
    if (existingItem) {
      const eid = (existingItem as any)._id || (existingItem as any).id;
      const res = await fetch(apiUrl(`/api/cart/${eid}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existingItem, quantity: existingItem.quantity + quantity })
      });
      const updated = await res.json();
      set({ cart: cart.map(item => ((item as any)._id || (item as any).id) === eid ? updated : item) });
    } else {
      const res = await fetch(apiUrl('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, quantity })
      });
      const created = await res.json();
      set({ cart: [...cart, created] });
    }
  },

  removeFromCart: async (productId) => {
    const { cart } = get();
    const item = cart.find(i => ((i.product as any)._id || i.product.id) === productId);
    if (!item) return;
    const iid = (item as any)._id || (item as any).id;
    await fetch(apiUrl(`/api/cart/${iid}`), { method: 'DELETE' });
    set({ cart: cart.filter(i => ((i as any)._id || (i as any).id) !== iid) });
  },

  updateCartQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      return get().removeFromCart(productId);
    }
    const { cart } = get();
    const item = cart.find(i => ((i.product as any)._id || i.product.id) === productId);
    if (!item) return;
    
    const iid = (item as any)._id || (item as any).id;
    const res = await fetch(apiUrl(`/api/cart/${iid}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, quantity })
    });
    const updated = await res.json();
    set({ cart: cart.map(i => ((i as any)._id || (i as any).id) === iid ? updated : i) });
  },

  clearCart: async () => {
    await fetch(apiUrl('/api/cart'), { method: 'DELETE' });
    set({ cart: [] });
  },

  submitInquiry: async (inquiryData) => {
    const res = await fetch(apiUrl('/api/inquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    const created = await res.json();
    set(state => ({ inquiries: [...state.inquiries, created] }));
  },

  updateInquiryStatus: async (id, status) => {
    const res = await fetch(apiUrl(`/api/inquiries/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    set(state => ({ inquiries: state.inquiries.map(i => ((i as any)._id || i.id) === id ? updated : i) }));
  },

  placeOrder: async (customerDetails) => {
    const { cart } = get();
    if (cart.length === 0) throw new Error("Cart is empty");

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const res = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, totalAmount, ...customerDetails })
    });
    const created = await res.json();
    set(state => ({ orders: [created, ...state.orders] }));
    await get().clearCart();
    return created._id || created.id;
  },

  updateOrderStatus: async (id, status) => {
    const res = await fetch(apiUrl(`/api/orders/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    set(state => ({ orders: state.orders.map(o => ((o as any)._id || o.id) === id ? updated : o) }));
  },

  addService: async (service) => {
    const res = await fetch(apiUrl('/api/services'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    const created = await res.json();
    set(state => ({ services: [...state.services, created] }));
  },

  updateService: async (id, updates) => {
    const res = await fetch(apiUrl(`/api/services/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    set(state => ({ services: state.services.map(s => ((s as any)._id || s.id) === id ? updated : s) }));
  },

  deleteService: async (id) => {
    await fetch(apiUrl(`/api/services/${id}`), { method: 'DELETE' });
    set(state => ({ services: state.services.filter(s => ((s as any)._id || s.id) !== id) }));
  },

  addProduct: async (product) => {
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const created = await res.json();
    set(state => ({ products: [...state.products, created] }));
  },

  updateProduct: async (id, updates) => {
    const res = await fetch(apiUrl(`/api/products/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    set(state => ({ products: state.products.map(p => ((p as any)._id || p.id) === id ? updated : p) }));
  },

  deleteProduct: async (id) => {
    await fetch(apiUrl(`/api/products/${id}`), { method: 'DELETE' });
    set(state => ({ products: state.products.filter(p => ((p as any)._id || p.id) !== id) }));
  },
}));