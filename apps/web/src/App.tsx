import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { 
  Menu, X, ShoppingCart, ChevronRight, Plus, Minus, Trash2, 
  Mail, Phone, MapPin, CheckCircle, ArrowRight, Zap, 
  Heart, Clock, Send, Star, Shield, Users
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// --- Types ---
export interface LocalProduct {
  id: string;
  _id?: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export interface LocalService {
  id: string;
  _id?: string;
  title: string;
  description: string;
  icon: keyof typeof ICON_MAP;
  price: string;
  features: string[];
}

export interface LocalCartItem extends LocalProduct {
  quantity: number;
}

const ICON_MAP = {
  Zap, Heart, Clock, Star, Shield, Users, User: Users
};

// --- Store ---
interface AppState {
  services: LocalService[];
  products: LocalProduct[];
  cart: LocalCartItem[];
  loadAll: () => Promise<void>;
  addToCart: (product: LocalProduct) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  submitInquiry: (inquiry: any) => Promise<void>;
  placeOrder: (order: any) => Promise<string>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  services: [],
  products: [],
  cart: [],

  loadAll: async () => {
    try {
      const [servicesRes, productsRes, cartRes] = await Promise.all([
        fetch(apiUrl('/api/services')).then(r => r.json()),
        fetch(apiUrl('/api/products')).then(r => r.json()),
        fetch(apiUrl('/api/cart')).then(r => r.json()),
      ]);
      set({ 
        services: Array.isArray(servicesRes) ? servicesRes : [], 
        products: Array.isArray(productsRes) ? productsRes : [], 
        cart: Array.isArray(cartRes) ? cartRes : [] 
      });
    } catch (err) {
      console.error("Failed to load data", err);
    }
  },

  addToCart: async (product) => {
    const { cart } = get();
    const pid = product._id || product.id;
    const existing = cart.find(item => (item._id || item.id) === pid);
    
    if (existing) {
      const existingId = existing._id || existing.id;
      const res = await fetch(apiUrl(`/api/cart/${existingId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existing, quantity: existing.quantity + 1 })
      });
      const updated = await res.json();
      set({ cart: cart.map(item => (item._id || item.id) === existingId ? updated : item) });
    } else {
      const res = await fetch(apiUrl('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, quantity: 1 })
      });
      const created = await res.json();
      set({ cart: [...cart, created] });
    }
  },

  removeFromCart: async (id) => {
    await fetch(apiUrl(`/api/cart/${id}`), { method: 'DELETE' });
    set({ cart: get().cart.filter(item => (item._id || item.id) !== id) });
  },

  updateQuantity: async (id, quantity) => {
    const { cart } = get();
    const existing = cart.find(item => (item._id || item.id) === id);
    if (!existing) return;
    
    const newQty = Math.max(1, quantity);
    const res = await fetch(apiUrl(`/api/cart/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, quantity: newQty })
    });
    const updated = await res.json();
    set({ cart: cart.map(item => (item._id || item.id) === id ? updated : item) });
  },

  clearCart: async () => {
    await fetch(apiUrl('/api/cart'), { method: 'DELETE' });
    set({ cart: [] });
  },

  submitInquiry: async (inquiryData) => {
    await fetch(apiUrl('/api/inquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
  },

  placeOrder: async (orderData) => {
    const { cart } = get();
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const res = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, items: cart, totalAmount })
    });
    const created = await res.json();
    await get().clearCart();
    return created._id || created.id;
  }
}));

// --- Layout Components ---
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const cartItems = useAppStore((s) => s.cart);
  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Products', path: '/products' },
    { name: 'Contact', path: '/contact' },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-indigo-500" />
            <Link to="/" className="text-xl font-bold tracking-tight text-white">
              FitMarket<span className="text-indigo-500">Hub</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-indigo-400",
                    location.pathname === link.path ? "text-indigo-400" : "text-slate-300"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/cart" className="relative text-slate-300 hover:text-indigo-400 transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative text-slate-300">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium",
                  location.pathname === link.path
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
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

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-indigo-500" />
              <span className="text-lg font-bold">FitMarket<span className="text-indigo-500">Hub</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              Empowering your fitness journey with premium services and high-quality gear.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-indigo-400">Our Services</Link></li>
              <li><Link to="/products" className="hover:text-indigo-400">Shop Products</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-400">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-400">Return Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@fitmarkethub.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 123-4567</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Iron Street, NY 10001</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} FitMarket Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// --- Page Components ---

function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <Badge variant="outline" className="mb-6 border-indigo-500/30 text-indigo-400 bg-indigo-500/10 py-1.5 px-4">
            Welcome to the Next Level
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl mb-8 max-w-4xl">
            Elevate Your Performance with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Premium Gear</span> & Expert Coaching
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Everything you need to reach your fitness goals in one place. Discover our top-tier gym services and shop the best equipment and supplements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12">
              <Link to="/products">
                Shop Gear <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 h-12">
              <Link to="/services">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-950/50 border-slate-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Premium Quality</CardTitle>
                <CardDescription className="text-slate-400">All our products are rigorously tested to ensure they meet the highest standards of durability and performance.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Expert Trainers</CardTitle>
                <CardDescription className="text-slate-400">Our certified professionals are dedicated to helping you achieve your specific fitness goals safely and efficiently.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-950/50 border-slate-800">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Secure Shopping</CardTitle>
                <CardDescription className="text-slate-400">Shop with confidence using our secure checkout process and reliable customer support team.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServicesPage() {
  const services = useAppStore(s => s.services);

  return (
    <div className="py-16 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-white sm:text-5xl mb-4">Our Services</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Choose the right path for your fitness journey. We offer a variety of services tailored to your individual needs and goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(services ?? []).map((service) => {
          const sid = service._id || service.id;
          const Icon = ICON_MAP[service.icon as keyof typeof ICON_MAP] || Zap;
          return (
            <Card key={sid} className="bg-slate-900 border-slate-800 overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Icon className="h-8 w-8" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm py-1 px-3">
                    {service.price}
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-white mb-2">{service.title}</CardTitle>
                <CardDescription className="text-slate-400 text-base leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Separator className="bg-slate-800 mb-6" />
                <ul className="space-y-3">
                  {(service.features ?? []).map((feature, idx) => (
                    <li key={idx} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                  <Link to="/contact">Inquire Now</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProductsPage() {
  const products = useAppStore(s => s.products);
  const addToCart = useAppStore((s) => s.addToCart);
  const [searchTerm, setSearchTerm] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }, [searchTerm, products]);

  const handleAddToCart = async (product: LocalProduct) => {
    await addToCart(product);
    const pid = product._id || product.id;
    setAddedId(pid);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="py-16 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-5xl mb-4">Shop Products</h1>
          <p className="text-lg text-slate-400 max-w-xl">
            Gear up with our selection of premium supplements and equipment designed to maximize your results.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-lg">No products found matching "{searchTerm}".</p>
          <Button variant="link" className="text-indigo-400 mt-4" onClick={() => setSearchTerm('')}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(filteredProducts ?? []).map((product) => {
            const pid = product._id || product.id;
            return (
              <Card key={pid} className="bg-slate-900 border-slate-800 flex flex-col group">
                <div className="relative overflow-hidden rounded-t-xl bg-slate-800 aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className="absolute top-4 right-4 bg-indigo-600/90 hover:bg-indigo-600 text-white backdrop-blur-sm">
                    {product.category}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <CardTitle className="text-xl text-white leading-tight">{product.name}</CardTitle>
                    <span className="text-lg font-bold text-indigo-400 flex-shrink-0">${product.price.toFixed(2)}</span>
                  </div>
                  <CardDescription className="text-slate-400 line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pb-6">
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className={cn(
                      "w-full transition-all duration-300",
                      addedId === pid 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                  >
                    {addedId === pid ? (
                      <span className="flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Added to Cart</span>
                    ) : (
                      <span className="flex items-center"><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartPage() {
  const { cart, updateQuantity, removeFromCart, placeOrder } = useAppStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', name: '' });

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const tax = subtotal * 0.08; // 8% simulated tax
  const total = subtotal + tax;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    try {
      await placeOrder(formData);
      setOrderComplete(true);
    } catch (err) {
      console.error(err);
    }
    setIsCheckingOut(false);
  };

  if (orderComplete) {
    return (
      <div className="py-20 container mx-auto px-4 text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Order Confirmed!</h1>
        <p className="text-slate-400 text-lg mb-8">
          Thank you for your purchase. We've sent an email confirmation with your order details and tracking information.
        </p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-24 container mx-auto px-4 text-center">
        <ShoppingCart className="h-16 w-16 text-slate-700 mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-white mb-4">Your cart is empty</h2>
        <p className="text-slate-400 mb-8">Looks like you haven't added any products yet.</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-16 container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white mb-10">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          {(cart ?? []).map((item) => {
            const iid = item._id || item.id;
            return (
              <div key={iid} className="flex flex-col sm:flex-row items-center gap-6 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="h-24 w-24 rounded-md bg-slate-800 flex-shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{item.category}</p>
                  <p className="text-indigo-400 font-medium mt-2">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => updateQuantity(iid, item.quantity - 1)}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(iid, item.quantity + 1)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(iid)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-950 rounded-lg border border-slate-800"
                    title="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout Form */}
        <div className="lg:col-span-4">
          <Card className="bg-slate-900 border-slate-800 sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-slate-700 my-4" />
              <div className="flex justify-between text-white text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <form onSubmit={handleCheckout} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email for Order Confirmation</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData(s => ({ ...s, email: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white" 
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white" 
                    placeholder="John Doe"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isCheckingOut}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 mt-4"
                >
                  {isCheckingOut ? 'Processing...' : 'Place Order Securely'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  const submitInquiry = useAppStore(s => s.submitInquiry);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitInquiry(formData);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <div className="py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-white sm:text-5xl mb-4">Get in Touch</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Have questions about our services, products, or your order? Fill out the form below and our team will get back to you shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info */}
        <div className="space-y-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Email Us</h3>
                <p className="text-slate-400 text-sm mb-2">For general inquiries and support.</p>
                <a href="mailto:support@fitmarkethub.com" className="text-indigo-400 hover:underline">support@fitmarkethub.com</a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Call Us</h3>
                <p className="text-slate-400 text-sm mb-2">Mon-Fri from 8am to 8pm EST.</p>
                <a href="tel:+15551234567" className="text-indigo-400 hover:underline">+1 (555) 123-4567</a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Visit Us</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  123 Iron Street<br />
                  Fitness District, NY 10001<br />
                  United States
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Send an Inquiry</CardTitle>
            <CardDescription className="text-slate-400">We aim to respond to all inquiries within 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-medium text-white">Message Sent!</h3>
                <p className="text-slate-400">Thank you for reaching out. We will review your inquiry and respond soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Your Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                  <Input 
                    id="subject" 
                    required 
                    value={formData.subject}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-300">Message</Label>
                  <Textarea 
                    id="message" 
                    required 
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="bg-slate-950 border-slate-700 text-white resize-none" 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                >
                  {isSubmitting ? 'Sending...' : (
                    <span className="flex items-center">Send Message <Send className="ml-2 h-4 w-4" /></span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const loadAll = useAppStore(s => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Fallback route */}
          <Route path="*" element={
            <div className="py-32 text-center container mx-auto">
              <h1 className="text-4xl font-bold mb-4 text-white">404 - Page Not Found</h1>
              <Button asChild variant="link" className="text-indigo-400">
                <Link to="/">Return Home</Link>
              </Button>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}