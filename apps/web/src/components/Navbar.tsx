import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Dumbbell } from 'lucide-react';
import { create } from 'zustand';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- Global Cart Store ---
export interface CartItem {
  id: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  
  loadCart: async () => {
    try {
      const res = await fetch(apiUrl('/api/cart'));
      const items = await res.json();
      set({ items: Array.isArray(items) ? items : [] });
    } catch (err) {
      console.error(err);
    }
  },

  addItem: async (item) => {
    const iid = item._id || item.id;
    const { items } = get();
    const existing = items.find(i => (i._id || i.id) === iid);
    if (existing) {
      const existingId = existing._id || existing.id;
      const res = await fetch(apiUrl(`/api/cart/${existingId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existing, quantity: existing.quantity + item.quantity })
      });
      const updated = await res.json();
      set({ items: items.map(i => (i._id || i.id) === existingId ? updated : i) });
    } else {
      const res = await fetch(apiUrl('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const created = await res.json();
      set({ items: [...items, created] });
    }
  },

  removeItem: async (id) => {
    await fetch(apiUrl(`/api/cart/${id}`), { method: 'DELETE' });
    set({ items: get().items.filter(i => (i._id || i.id) !== id) });
  },

  updateQuantity: async (id, quantity) => {
    const { items } = get();
    const existing = items.find(i => (i._id || i.id) === id);
    if (!existing) return;
    const newQty = Math.max(1, quantity);
    const res = await fetch(apiUrl(`/api/cart/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, quantity: newQty })
    });
    const updated = await res.json();
    set({ items: items.map(i => (i._id || i.id) === id ? updated : i) });
  },

  clearCart: async () => {
    await fetch(apiUrl('/api/cart'), { method: 'DELETE' });
    set({ items: [] });
  },
}));

// --- Navbar Component ---
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const loadCart = useCartStore((state) => state.loadCart);
  
  useEffect(() => { loadCart(); }, [loadCart]);

  const cartCount = (cartItems ?? []).reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Products', path: '/products' },
    { name: 'Inquiries', path: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
                FitMarket Hub
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6 text-foreground" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top-2">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}