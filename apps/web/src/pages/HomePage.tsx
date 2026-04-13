import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingCart, 
  Users, 
  Heart, 
  Zap, 
  Star,
  CheckCircle,
  Mail,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGymStore } from '@/store/gymStore';

export default function HomePage() {
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const loadAll = useGymStore(s => s.loadAll);
  const services = useGymStore(s => s.services);
  const products = useGymStore(s => s.products);
  const addToCart = useGymStore(s => s.addToCart);

  useEffect(() => { loadAll() }, [loadAll]);

  const handleAddToCart = async (product: any) => {
    const pid = product._id || product.id;
    setAddingToCart(pid);
    await addToCart(product);
    setTimeout(() => {
      setAddingToCart(null);
    }, 800);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => {
      setSubscribed(false);
    }, 3000);
  };

  const featuredServices = (services ?? []).slice(0, 3);
  const featuredProducts = (products ?? []).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-32 border-b border-border">
        {/* Subtle background glow for dark theme */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Star className="mr-2 h-4 w-4" />
            <span>Welcome to the new FitMarket Hub</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Fitness Journey</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Your all-in-one platform for premium gym services, top-tier fitness equipment, and expert guidance. Join the community today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 text-base" onClick={() => navigate('/services')}>
              Explore Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={() => navigate('/products')}>
              Shop Gear
              <ShoppingCart className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-muted-foreground text-sm font-medium">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Certified Trainers</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Premium Equipment</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES SECTION */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Elite Gym Services</h2>
              <p className="text-muted-foreground">
                Whether you're just starting out or looking to break past a plateau, our expert-led services are designed to get you results.
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/services')} className="group shrink-0">
              View All Services
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredServices.map((service) => {
              const sid = service._id || service.id;
              return (
                <Card key={sid} className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
                      <Zap className="h-6 w-6" />
                    </div>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription className="text-base mt-2">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${service.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/services/${sid}`)}>
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Top Rated Gear & Supplements</h2>
              <p className="text-muted-foreground">
                Fuel your workouts and recover faster with our curated selection of high-quality fitness products.
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/products')} className="group shrink-0">
              Shop All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const pid = product._id || product.id;
              return (
                <Card key={pid} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-colors flex flex-col">
                  <div className="aspect-square bg-muted/50 flex items-center justify-center p-6 relative">
                    <img src={product.imageUrl || product.image} alt={product.name} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-all duration-300" />
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-border">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {product.rating || '4.5'}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-0 flex-grow">
                    <div className="text-xs text-primary mb-1 font-medium tracking-wider uppercase">{product.category}</div>
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  </CardHeader>
                  <CardFooter className="p-4 pt-4 flex items-center justify-between mt-auto">
                    <span className="font-bold text-lg">${(product.price || 0).toFixed(2)}</span>
                    <Button 
                      size="sm" 
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === pid}
                    >
                      {addingToCart === pid ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA / INQUIRY TEASER */}
      <section className="py-24 bg-gradient-to-t from-background to-muted/20 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold tracking-tight mb-4">Have Questions?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Whether you need help choosing the right service or have questions about an order, our team is here to assist you.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" size="lg" className="h-12 shrink-0">
              {subscribed ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
              {subscribed ? 'Sent!' : 'Contact Us'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4">
            Or visit our <Link to="/contact" className="text-primary hover:underline">detailed inquiry form</Link> for specific requests.
          </p>
        </div>
      </section>
    </div>
  );
}