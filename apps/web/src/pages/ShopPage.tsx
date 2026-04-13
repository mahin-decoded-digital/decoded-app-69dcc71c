import React, { useState, useMemo, useEffect } from 'react';
import { create } from 'zustand';
import { Search, ShoppingCart, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

// --- Types & Store ---

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  products: Product[];
  loadAll: () => Promise<void>;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  products: [],
  
  loadAll: async () => {
    try {
      const [productsRes, cartRes] = await Promise.all([
        fetch(apiUrl('/api/products')).then(r => r.json()),
        fetch(apiUrl('/api/cart')).then(r => r.json()),
      ]);
      set({ 
        products: Array.isArray(productsRes) ? productsRes : [], 
        items: Array.isArray(cartRes) ? cartRes : [] 
      });
    } catch (err) {
      console.error(err);
    }
  },

  addItem: async (product) => {
    const pid = product._id || product.id;
    const { items } = get();
    const existing = items.find(i => (i._id || i.id) === pid);
    if (existing) {
      const iid = existing._id || existing.id;
      const res = await fetch(apiUrl(`/api/cart/${iid}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existing, quantity: existing.quantity + 1 })
      });
      const updated = await res.json();
      set({ items: items.map(i => (i._id || i.id) === iid ? updated : i) });
    } else {
      const res = await fetch(apiUrl('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, quantity: 1 })
      });
      const created = await res.json();
      set({ items: [...items, created] });
    }
  },

  removeItem: async (productId) => {
    await fetch(apiUrl(`/api/cart/${productId}`), { method: 'DELETE' });
    set({ items: get().items.filter(i => (i._id || i.id) !== productId) });
  },

  updateQuantity: async (productId, delta) => {
    const { items } = get();
    const existing = items.find(i => (i._id || i.id) === productId);
    if (!existing) return;
    
    const newQuantity = Math.max(1, existing.quantity + delta);
    const res = await fetch(apiUrl(`/api/cart/${productId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, quantity: newQuantity })
    });
    const updated = await res.json();
    set({ items: items.map(i => (i._id || i.id) === productId ? updated : i) });
  },

  clearCart: async () => {
    await fetch(apiUrl('/api/cart'), { method: 'DELETE' });
    set({ items: [] });
  },

  cartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));

// --- Components ---

export default function ShopPage() {
  const loadAll = useCartStore(s => s.loadAll);
  useEffect(() => { loadAll(); }, [loadAll]);

  const [searchQuery, setSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  
  const products = useCartStore((s) => s.products);
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartTotal = useCartStore((s) => s.cartTotal());

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
  }, [searchQuery, products]);

  const handleAddToCart = async (product: Product) => {
    const pid = product._id || product.id;
    setAddingToCart((prev) => ({ ...prev, [pid]: true }));
    await addItem(product);
    setTimeout(() => {
      setAddingToCart((prev) => ({ ...prev, [pid]: false }));
    }, 1500);
  };

  const totalItemCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              FitMarket Shop
            </h1>
            <p className="text-slate-400 mt-2">Premium gear and supplements for your peak performance.</p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900/50 border-slate-700 text-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Cart Dialog Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-in zoom-in">
                      {totalItemCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md w-full">
                <DialogHeader>
                  <DialogTitle>Your Shopping Cart</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Your cart is empty.</p>
                      <p className="text-sm mt-1">Add some products to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {cartItems.map((item) => {
                        const iid = item._id || item.id;
                        return (
                          <div key={iid} className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md border border-slate-800" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                              <p className="text-indigo-400 font-medium">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                                <button onClick={() => updateQuantity(iid, -1)} className="px-2 py-1 text-slate-400 hover:text-white transition-colors">-</button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(iid, 1)} className="px-2 py-1 text-slate-400 hover:text-white transition-colors">+</button>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(iid)} className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {cartItems.length > 0 && (
                  <div className="border-t border-slate-800 pt-4 space-y-4">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-indigo-400">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/20 rounded-xl border border-slate-800/50 border-dashed">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">No products found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const pid = product._id || product.id;
              return (
                <Card key={pid} className="bg-slate-900/80 border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-colors duration-300">
                  <div className="relative aspect-video overflow-hidden bg-slate-800">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-slate-300 border border-slate-700">
                      {product.category}
                    </div>
                  </div>
                  
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-bold text-slate-100 leading-tight">
                        {product.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 text-sm line-clamp-2 mt-1">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0 flex-1 flex items-end">
                    <p className="text-2xl font-black text-indigo-400">
                      ${product.price.toFixed(2)}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className={`w-full transition-all duration-300 ${
                        addingToCart[pid] 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {addingToCart[pid] ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}