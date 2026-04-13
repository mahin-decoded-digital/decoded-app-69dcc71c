import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGymStore } from '@/store/gymStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  
  const loadAll = useGymStore((s) => s.loadAll);
  useEffect(() => { loadAll(); }, [loadAll]);

  const cart = useGymStore((s) => s.cart);
  const updateCartQuantity = useGymStore((s) => s.updateCartQuantity);
  const removeFromCart = useGymStore((s) => s.removeFromCart);
  const placeOrder = useGymStore((s) => s.placeOrder);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: ''
  });

  const totals = useMemo(() => {
    const items = cart ?? [];
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart]);

  const handleQuantityChange = async (productId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      await updateCartQuantity(productId, newQty);
    } else {
      await removeFromCart(productId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      return; 
    }

    setIsSubmitting(true);
    
    try {
      const orderId = await placeOrder(formData);
      setSuccessOrderId(orderId);
    } catch (error) {
      console.error("Failed to place order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrderId) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Order Confirmed!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Thank you for your purchase. Your order has been placed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-6">
              <p className="text-sm text-muted-foreground mb-1">Order Reference ID</p>
              <p className="font-mono text-lg font-medium text-foreground">{successOrderId}</p>
            </div>
            <p className="text-muted-foreground">
              We've sent a confirmation email to <span className="font-medium text-foreground">{formData.customerEmail}</span> with your order details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              Return Home
            </Button>
            <Button onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Looks like you haven't added anything to your cart yet. Browse our top-quality gym products and apparel.
            </p>
          </div>
          <Button size="lg" className="mt-4" onClick={() => navigate('/shop')}>
            Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/shop')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground">{totals.itemCount} item(s) in your cart</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="space-y-4">
            {cart.map((item) => {
              const pid = (item.product as any)._id || item.product.id;
              return (
                <Card key={pid} className="overflow-hidden bg-card/50 backdrop-blur-sm transition-colors hover:bg-card/80">
                  <div className="flex flex-col sm:flex-row">
                    <div className="h-48 w-full shrink-0 bg-muted sm:h-auto sm:w-48">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 pr-4">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.product.category}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2 rounded-md border border-input bg-background/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none border-r border-input"
                            onClick={() => handleQuantityChange(pid, item.quantity, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none border-l border-input"
                            onClick={() => handleQuantityChange(pid, item.quantity, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeFromCart(pid)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="sticky top-24 bg-card/40 backdrop-blur-sm border-primary/10">
            <form onSubmit={handleCheckout}>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8%)</span>
                    <span>${totals.tax}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-primary font-medium">Calculated next</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>Total</span>
                    <span>${totals.total}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Shipping Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      placeholder="John Doe"
                      required
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress">Shipping Address</Label>
                    <Textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      placeholder="123 Fitness Street, Gym City, GC 12345"
                      required
                      rows={3}
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      className="resize-none bg-background/50"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? 'Processing Order...' : `Pay $${totals.total}`}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}