import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle2 } from 'lucide-react';

const demoSites = {
  concrete: {
    name: 'Solid Foundation Concrete',
    tagline: 'Building Strong Foundations Since 1995',
    description: 'Professional concrete contractor serving the Inland Empire with quality workmanship and reliable service.',
    color: 'from-slate-600 to-slate-800',
    services: ['Driveways & Patios', 'Foundations', 'Stamped Concrete', 'Concrete Repair', 'Commercial Flatwork'],
    features: ['Licensed & Insured', 'Free Estimates', '25+ Years Experience', 'Satisfaction Guaranteed'],
  },
  electrical: {
    name: 'Volt Electric Pro',
    tagline: '24/7 Emergency Electrical Services',
    description: 'Trusted electrical contractor providing residential and commercial electrical solutions.',
    color: 'from-amber-500 to-orange-600',
    services: ['Electrical Repairs', 'Panel Upgrades', 'EV Charger Installation', 'Lighting Design', 'Emergency Services'],
    features: ['Licensed Electricians', '24/7 Emergency', 'Upfront Pricing', 'Same Day Service'],
  },
  landscaping: {
    name: 'Green Valley Landscaping',
    tagline: 'Transform Your Outdoor Space',
    description: 'Full-service landscaping company creating beautiful outdoor living spaces.',
    color: 'from-emerald-500 to-green-700',
    services: ['Landscape Design', 'Hardscaping', 'Irrigation Systems', 'Lawn Maintenance', 'Tree Services'],
    features: ['Custom Designs', 'Drought Tolerant', 'Weekly Maintenance', 'Free Consultations'],
  },
  general: {
    name: 'Hammer & Nail Construction',
    tagline: 'Quality Craftsmanship, Every Project',
    description: 'Full-service general contractor specializing in residential and commercial construction.',
    color: 'from-orange-500 to-red-600',
    services: ['Home Remodels', 'Room Additions', 'Kitchen & Bath', 'Custom Homes', 'Commercial Build-Outs'],
    features: ['Licensed Contractor', 'Financing Available', 'Warranty Included', 'Project Management'],
  },
  plumbing: {
    name: 'Crystal Clear Plumbing',
    tagline: 'Your Local Plumbing Experts',
    description: 'Professional plumbing services for homes and businesses throughout the Inland Empire.',
    color: 'from-blue-500 to-cyan-600',
    services: ['Drain Cleaning', 'Water Heaters', 'Leak Detection', 'Pipe Repair', 'Sewer Line Services'],
    features: ['24/7 Emergency', 'Upfront Pricing', 'Licensed & Bonded', 'Senior Discounts'],
  },
  roofing: {
    name: 'Apex Roofing Solutions',
    tagline: 'Protecting Homes From the Top Down',
    description: 'Expert roofing contractors providing quality roof installation and repair services.',
    color: 'from-gray-700 to-gray-900',
    services: ['Roof Replacement', 'Roof Repair', 'Storm Damage', 'Inspections', 'Maintenance Programs'],
    features: ['Free Inspections', 'Insurance Claims Help', '25-Year Warranty', 'Financing Options'],
  },
};

const DemoSite = () => {
  const { trade } = useParams<{ trade: string }>();
  const site = trade ? demoSites[trade as keyof typeof demoSites] : null;

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Demo Not Found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Link */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/#portfolio">
          <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hardhat Hosting
          </Button>
        </Link>
      </div>

      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm">
        🎨 This is a demo website preview • <Link to="/#contact" className="underline font-medium">Get this website for your business →</Link>
      </div>

      {/* Hero Section */}
      <section className={`bg-gradient-to-br ${site.color} py-24 lg:py-32`}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-5xl lg:text-7xl text-white mb-4">
            {site.name}
          </h1>
          <p className="text-xl lg:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            {site.tagline}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Get Free Quote
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-muted/50 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            {site.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-6">
              About {site.name}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {site.description} We pride ourselves on delivering exceptional service, 
              quality workmanship, and customer satisfaction. Our team of experienced 
              professionals is dedicated to meeting your needs with precision and care.
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              ))}
              <span className="text-muted-foreground ml-2">5.0 Rating (100+ Reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl lg:text-4xl text-foreground text-center mb-12">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {site.services.map((service) => (
              <div
                key={service}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-display text-xl text-foreground mb-2">{service}</h3>
                <p className="text-muted-foreground text-sm">
                  Professional {service.toLowerCase()} services tailored to your needs.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border/50 p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-4">
                Get Your Free Quote Today
              </h2>
              <p className="text-muted-foreground">
                Contact us for a free estimate on your next project.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-foreground">Call Us</h4>
                <p className="text-muted-foreground">(909) 555-1234</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-foreground">Email Us</h4>
                <p className="text-muted-foreground">info@example.com</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-foreground">Visit Us</h4>
                <p className="text-muted-foreground">Rancho Cucamonga, CA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`bg-gradient-to-br ${site.color} py-16`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl lg:text-4xl text-white mb-4">
            Want a Website Like This?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Hardhat Hosting can build you a professional website just like this one. 
            Get started today and grow your business online.
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Get This Website
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-8">
        <div className="container mx-auto px-4 text-center text-secondary-foreground/70 text-sm">
          <p>This is a demo website by Hardhat Hosting</p>
          <Link to="/" className="text-primary hover:underline">
            hardhathosting.com
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default DemoSite;
