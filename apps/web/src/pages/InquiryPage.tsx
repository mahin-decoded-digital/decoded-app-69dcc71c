import React, { useState, FormEvent, useEffect } from 'react';
import { useGymStore } from '@/store/gymStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Send, CheckCircle, Mail, User, Phone, MessageSquare, AlertCircle } from 'lucide-react';

export default function InquiryPage() {
  const submitInquiry = useGymStore((s) => s.submitInquiry);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions about our services, products, or memberships? Drop us a line.
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Customer Inquiry
            </CardTitle>
            <CardDescription>
              Fill out the form below and our team will get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Message Sent Successfully!</h3>
                <p className="text-muted-foreground max-w-md">
                  Thank you for reaching out. We've received your inquiry and will respond to the email provided shortly.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => setIsSuccess(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Provide details about your inquiry..."
                    className="min-h-[150px] resize-y"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full sm:w-auto min-w-[200px]" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </span>
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