import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { cn } from "@/lib/utils";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Form submitted:", formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    }, 3000);
  };

  return (
    <section id="contact" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Get In Touch
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            READY TO GET
            <span className="text-gradient"> STARTED?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Contact us today for a free consultation. We'll discuss your needs 
            and show you how we can help your construction business grow online.
          </p>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <AnimatedSection animation="slide-right" delay={100}>
            <div className="space-y-8">
              <div className="glass rounded-2xl p-8 card-hover">
                <h3 className="font-display text-2xl text-foreground mb-6">
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <a
                    href="tel:+19096609657"
                    className="flex items-start gap-4 group touch-feedback rounded-lg p-2 -m-2"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 group-hover:glow transition-all group-hover:scale-105">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Call Us</p>
                      <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        (909) 660-9657
                      </p>
                    </div>
                  </a>

                  <a
                    href="mailto:info@hardhathosting.com"
                    className="flex items-start gap-4 group touch-feedback rounded-lg p-2 -m-2"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 group-hover:glow transition-all group-hover:scale-105">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email Us</p>
                      <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        info@hardhathosting.com
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-2 -m-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-lg font-semibold text-foreground">
                        Rancho Cucamonga, CA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2 -m-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <p className="text-lg font-semibold text-foreground">
                        Mon - Fri: 8AM - 6PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 glow group hover:bg-primary/15 transition-colors">
                <h4 className="font-display text-xl text-foreground mb-2">
                  Free Consultation
                </h4>
                <p className="text-muted-foreground">
                  Not sure where to start? Schedule a free 30-minute call with our team 
                  to discuss your website needs.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection animation="slide-left" delay={200}>
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 card-hover">
              <h3 className="font-display text-2xl text-foreground mb-6">
                Send Us a Message
              </h3>
              
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="font-display text-xl text-foreground mb-2">Message Sent!</h4>
                  <p className="text-muted-foreground text-center">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg bg-muted/50 border outline-none transition-all text-foreground placeholder:text-muted-foreground",
                          focusedField === 'name' ? "border-primary ring-2 ring-primary/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                        )}
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg bg-muted/50 border outline-none transition-all text-foreground placeholder:text-muted-foreground",
                          focusedField === 'phone' ? "border-primary ring-2 ring-primary/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                        )}
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg bg-muted/50 border outline-none transition-all text-foreground placeholder:text-muted-foreground",
                        focusedField === 'email' ? "border-primary ring-2 ring-primary/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                      placeholder="Email Address"
                      required
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      onFocus={() => setFocusedField('company')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg bg-muted/50 border outline-none transition-all text-foreground placeholder:text-muted-foreground",
                        focusedField === 'company' ? "border-primary ring-2 ring-primary/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                      placeholder="Company Name"
                    />
                  </div>

                  <div className="relative">
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg bg-muted/50 border outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground",
                        focusedField === 'message' ? "border-primary ring-2 ring-primary/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className={cn(
                      "w-full glow group",
                      isSubmitting && "opacity-80 cursor-wait"
                    )}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Contact;
