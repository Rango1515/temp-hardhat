import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle2, Clock, Shield, Award } from 'lucide-react';

// Import demo images
import concreteImg from '@/assets/demo-concrete.jpg';
import electricalImg from '@/assets/demo-electrical.jpg';
import landscapingImg from '@/assets/demo-landscaping.jpg';
import generalImg from '@/assets/demo-general.jpg';
import plumbingImg from '@/assets/demo-plumbing.jpg';
import roofingImg from '@/assets/demo-roofing.jpg';

const demoSites = {
  concrete: {
    name: 'Solid Foundation Concrete',
    tagline: 'Building Strong Foundations Since 1995',
    description: 'Professional concrete contractor serving the Inland Empire with quality workmanship and reliable service.',
    image: concreteImg,
    accentColor: 'from-slate-700 to-slate-900',
    services: ['Driveways & Patios', 'Foundations', 'Stamped Concrete', 'Concrete Repair', 'Commercial Flatwork'],
    features: ['Licensed & Insured', 'Free Estimates', '25+ Years Experience', 'Satisfaction Guaranteed'],
  },
  electrical: {
    name: 'Volt Electric Pro',
    tagline: '24/7 Emergency Electrical Services',
    description: 'Trusted electrical contractor providing residential and commercial electrical solutions.',
    image: electricalImg,
    accentColor: 'from-amber-600 to-orange-700',
    services: ['Electrical Repairs', 'Panel Upgrades', 'EV Charger Installation', 'Lighting Design', 'Emergency Services'],
    features: ['Licensed Electricians', '24/7 Emergency', 'Upfront Pricing', 'Same Day Service'],
  },
  landscaping: {
    name: 'Green Valley Landscaping',
    tagline: 'Transform Your Outdoor Space',
    description: 'Full-service landscaping company creating beautiful outdoor living spaces.',
    image: landscapingImg,
    accentColor: 'from-emerald-600 to-green-800',
    services: ['Landscape Design', 'Hardscaping', 'Irrigation Systems', 'Lawn Maintenance', 'Tree Services'],
    features: ['Custom Designs', 'Drought Tolerant', 'Weekly Maintenance', 'Free Consultations'],
  },
  general: {
    name: 'Hammer & Nail Construction',
    tagline: 'Quality Craftsmanship, Every Project',
    description: 'Full-service general contractor specializing in residential and commercial construction.',
    image: generalImg,
    accentColor: 'from-orange-600 to-red-700',
    services: ['Home Remodels', 'Room Additions', 'Kitchen & Bath', 'Custom Homes', 'Commercial Build-Outs'],
    features: ['Licensed Contractor', 'Financing Available', 'Warranty Included', 'Project Management'],
  },
  plumbing: {
    name: 'Crystal Clear Plumbing',
    tagline: 'Your Local Plumbing Experts',
    description: 'Professional plumbing services for homes and businesses throughout the Inland Empire.',
    image: plumbingImg,
    accentColor: 'from-blue-600 to-cyan-700',
    services: ['Drain Cleaning', 'Water Heaters', 'Leak Detection', 'Pipe Repair', 'Sewer Line Services'],
    features: ['24/7 Emergency', 'Upfront Pricing', 'Licensed & Bonded', 'Senior Discounts'],
  },
  roofing: {
    name: 'Apex Roofing Solutions',
    tagline: 'Protecting Homes From the Top Down',
    description: 'Expert roofing contractors providing quality roof installation and repair services.',
    image: roofingImg,
    accentColor: 'from-gray-700 to-gray-900',
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
          <Button variant="outline" className="glass">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hardhat Hosting
          </Button>
        </Link>
      </div>

      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        🎨 This is a demo website preview • <Link to="/#contact" className="underline font-bold hover:no-underline">Get this website for your business →</Link>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={site.image}
            alt={site.name}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${site.accentColor} opacity-80`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl lg:text-7xl xl:text-8xl text-white mb-4 drop-shadow-2xl">
              {site.name}
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8">
              {site.tagline}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow text-lg px-8">
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-8">
                Get Free Quote
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-card border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {site.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-6">
              About <span className="text-gradient">{site.name}</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed">
              {site.description} We pride ourselves on delivering exceptional service, 
              quality workmanship, and customer satisfaction. Our team of experienced 
              professionals is dedicated to meeting your needs with precision and care.
            </p>
            <div className="flex justify-center items-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-7 h-7 text-primary fill-primary" />
              ))}
              <span className="text-foreground ml-3 font-medium">5.0 Rating (100+ Reviews)</span>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="glass rounded-xl p-6">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl text-foreground">25+</div>
                <div className="text-muted-foreground text-sm">Years Experience</div>
              </div>
              <div className="glass rounded-xl p-6">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl text-foreground">1000+</div>
                <div className="text-muted-foreground text-sm">Projects Completed</div>
              </div>
              <div className="glass rounded-xl p-6">
                <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl text-foreground">100%</div>
                <div className="text-muted-foreground text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 lg:py-28 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl lg:text-5xl text-foreground text-center mb-4">
            Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We offer a comprehensive range of professional services to meet all your needs.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {site.services.map((service, index) => (
              <div
                key={service}
                className="glass rounded-xl p-6 card-hover group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">{service}</h3>
                <p className="text-muted-foreground text-sm">
                  Professional {service.toLowerCase()} services tailored to your specific needs.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass rounded-2xl p-8 lg:p-12">
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-4">
                Get Your <span className="text-gradient">Free Quote</span> Today
              </h2>
              <p className="text-muted-foreground text-lg">
                Contact us for a free estimate on your next project.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/20 p-5 rounded-full glow">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-display text-lg text-foreground">Call Us</h4>
                <p className="text-muted-foreground">(909) 555-1234</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/20 p-5 rounded-full glow">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-display text-lg text-foreground">Email Us</h4>
                <p className="text-muted-foreground">info@example.com</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/20 p-5 rounded-full glow">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-display text-lg text-foreground">Visit Us</h4>
                <p className="text-muted-foreground">Rancho Cucamonga, CA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`relative py-20 overflow-hidden`}>
        <div className="absolute inset-0">
          <img
            src={site.image}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${site.accentColor} opacity-90`} />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Want a Website Like This?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Hardhat Hosting can build you a professional website just like this one. 
            Get started today and grow your business online.
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-10">
              Get This Website
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-10 border-t border-border/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p className="mb-2">This is a demo website by Hardhat Hosting</p>
          <Link to="/" className="text-primary hover:underline font-medium">
            hardhathosting.com
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default DemoSite;
