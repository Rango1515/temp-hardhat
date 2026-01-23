import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle2, Clock, Shield, Award, Leaf, Calculator, Sparkles, Ruler } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useSmoothScroll';
import AnimatedSection from '@/components/ui/AnimatedSection';

// Import demo images
import concreteImg from '@/assets/demo-concrete.jpg';
import electricalImg from '@/assets/demo-electrical.jpg';
import landscapingImg from '@/assets/demo-landscaping.jpg';
import generalImg from '@/assets/demo-general.jpg';
import plumbingImg from '@/assets/demo-plumbing.jpg';
import roofingImg from '@/assets/demo-roofing.jpg';
import architectureImg from '@/assets/demo-architecture.jpg';
import engineeringImg from '@/assets/demo-engineering.jpg';
import interiorImg from '@/assets/demo-interior.jpg';
import hvacImg from '@/assets/demo-hvac.jpg';
import solarImg from '@/assets/demo-solar.jpg';
import poolImg from '@/assets/demo-pool.jpg';

type LayoutStyle = 'standard' | 'creative' | 'technical' | 'modern';

interface DemoSiteData {
  name: string;
  tagline: string;
  description: string;
  image: string;
  accentColor: string;
  accentColorDark: string;
  services: string[];
  features: string[];
  layoutStyle: LayoutStyle;
  stats?: { label: string; value: string; icon: React.ElementType }[];
  uniqueFeature?: { title: string; description: string; icon: React.ElementType };
}

const demoSites: Record<string, DemoSiteData> = {
  concrete: {
    name: 'Solid Foundation Concrete',
    tagline: 'Building Strong Foundations Since 1995',
    description: 'Professional concrete contractor serving the Inland Empire with quality workmanship and reliable service.',
    image: concreteImg,
    accentColor: 'from-slate-600 to-slate-800',
    accentColorDark: 'bg-slate-700',
    services: ['Driveways & Patios', 'Foundations', 'Stamped Concrete', 'Concrete Repair', 'Commercial Flatwork'],
    features: ['Licensed & Insured', 'Free Estimates', '25+ Years Experience', 'Satisfaction Guaranteed'],
    layoutStyle: 'standard',
  },
  electrical: {
    name: 'Volt Electric Pro',
    tagline: '24/7 Emergency Electrical Services',
    description: 'Trusted electrical contractor providing residential and commercial electrical solutions.',
    image: electricalImg,
    accentColor: 'from-amber-500 to-orange-600',
    accentColorDark: 'bg-amber-600',
    services: ['Electrical Repairs', 'Panel Upgrades', 'EV Charger Installation', 'Lighting Design', 'Emergency Services'],
    features: ['Licensed Electricians', '24/7 Emergency', 'Upfront Pricing', 'Same Day Service'],
    layoutStyle: 'standard',
  },
  landscaping: {
    name: 'Green Valley Landscaping',
    tagline: 'Transform Your Outdoor Space',
    description: 'Full-service landscaping company creating beautiful outdoor living spaces.',
    image: landscapingImg,
    accentColor: 'from-emerald-500 to-green-700',
    accentColorDark: 'bg-emerald-600',
    services: ['Landscape Design', 'Hardscaping', 'Irrigation Systems', 'Lawn Maintenance', 'Tree Services'],
    features: ['Custom Designs', 'Drought Tolerant', 'Weekly Maintenance', 'Free Consultations'],
    layoutStyle: 'standard',
    uniqueFeature: { title: 'Eco-Friendly', description: 'Sustainable landscaping solutions', icon: Leaf },
  },
  general: {
    name: 'Hammer & Nail Construction',
    tagline: 'Quality Craftsmanship, Every Project',
    description: 'Full-service general contractor specializing in residential and commercial construction.',
    image: generalImg,
    accentColor: 'from-orange-500 to-red-600',
    accentColorDark: 'bg-orange-600',
    services: ['Home Remodels', 'Room Additions', 'Kitchen & Bath', 'Custom Homes', 'Commercial Build-Outs'],
    features: ['Licensed Contractor', 'Financing Available', 'Warranty Included', 'Project Management'],
    layoutStyle: 'standard',
  },
  plumbing: {
    name: 'Crystal Clear Plumbing',
    tagline: 'Your Local Plumbing Experts',
    description: 'Professional plumbing services for homes and businesses throughout the Inland Empire.',
    image: plumbingImg,
    accentColor: 'from-blue-500 to-cyan-600',
    accentColorDark: 'bg-blue-600',
    services: ['Drain Cleaning', 'Water Heaters', 'Leak Detection', 'Pipe Repair', 'Sewer Line Services'],
    features: ['24/7 Emergency', 'Upfront Pricing', 'Licensed & Bonded', 'Senior Discounts'],
    layoutStyle: 'standard',
  },
  roofing: {
    name: 'Apex Roofing Solutions',
    tagline: 'Protecting Homes From the Top Down',
    description: 'Expert roofing contractors providing quality roof installation and repair services.',
    image: roofingImg,
    accentColor: 'from-gray-600 to-gray-800',
    accentColorDark: 'bg-gray-700',
    services: ['Roof Replacement', 'Roof Repair', 'Storm Damage', 'Inspections', 'Maintenance Programs'],
    features: ['Free Inspections', 'Insurance Claims Help', '25-Year Warranty', 'Financing Options'],
    layoutStyle: 'standard',
  },
  architecture: {
    name: 'Blueprint Architecture',
    tagline: 'Where Vision Meets Design',
    description: 'Award-winning architecture firm creating iconic buildings and spaces that inspire.',
    image: architectureImg,
    accentColor: 'from-slate-500 to-blue-700',
    accentColorDark: 'bg-slate-600',
    services: ['Residential Design', 'Commercial Projects', 'Interior Architecture', 'Sustainable Design', '3D Visualization'],
    features: ['Award Winning', 'LEED Certified', 'Global Projects', 'Full Service'],
    layoutStyle: 'creative',
    stats: [
      { label: 'Projects', value: '200+', icon: Ruler },
      { label: 'Awards', value: '15', icon: Award },
      { label: 'Team', value: '40+', icon: Shield },
    ],
  },
  engineering: {
    name: 'Precision Engineering',
    tagline: 'Engineering Excellence, Built to Last',
    description: 'Structural and civil engineering consultants delivering innovative solutions for complex projects.',
    image: engineeringImg,
    accentColor: 'from-teal-500 to-cyan-700',
    accentColorDark: 'bg-teal-600',
    services: ['Structural Analysis', 'Civil Engineering', 'Foundation Design', 'Seismic Retrofitting', 'Construction Oversight'],
    features: ['PE Licensed', 'ISO Certified', 'BIM Services', 'Expert Testimony'],
    layoutStyle: 'technical',
    stats: [
      { label: 'Projects', value: '500+', icon: Ruler },
      { label: 'Engineers', value: '25', icon: Shield },
      { label: 'Years', value: '30+', icon: Clock },
    ],
  },
  interior: {
    name: 'Studio Luxe Interiors',
    tagline: 'Luxury Living, Designed for You',
    description: 'Premier interior design studio creating sophisticated, personalized spaces that reflect your style.',
    image: interiorImg,
    accentColor: 'from-rose-400 to-pink-600',
    accentColorDark: 'bg-rose-500',
    services: ['Full Room Design', 'Color Consultation', 'Furniture Selection', 'Space Planning', 'Art Curation'],
    features: ['Luxury Brands', 'Virtual Tours', 'Custom Pieces', 'White Glove Service'],
    layoutStyle: 'creative',
    uniqueFeature: { title: 'Virtual Design', description: 'See your space before we build it', icon: Sparkles },
  },
  hvac: {
    name: 'Climate Control HVAC',
    tagline: 'Comfort in Every Season',
    description: 'Professional heating, ventilation, and air conditioning services for optimal indoor comfort.',
    image: hvacImg,
    accentColor: 'from-cyan-400 to-blue-600',
    accentColorDark: 'bg-cyan-500',
    services: ['AC Installation', 'Heating Systems', 'Duct Cleaning', 'Maintenance Plans', 'Indoor Air Quality'],
    features: ['24/7 Service', 'Energy Efficient', 'Smart Thermostats', 'Financing Available'],
    layoutStyle: 'technical',
    uniqueFeature: { title: 'Energy Savings', description: 'Calculate your potential savings', icon: Calculator },
  },
  solar: {
    name: 'SunPower Solar',
    tagline: 'Harness the Power of the Sun',
    description: 'Leading solar installation company helping homeowners save money and protect the environment.',
    image: solarImg,
    accentColor: 'from-amber-400 to-orange-500',
    accentColorDark: 'bg-amber-500',
    services: ['Solar Installation', 'Battery Storage', 'System Monitoring', 'Maintenance', 'Commercial Solar'],
    features: ['25-Year Warranty', 'Tax Credits', 'Net Metering', 'No Money Down'],
    layoutStyle: 'modern',
    stats: [
      { label: 'kW Installed', value: '5M+', icon: Leaf },
      { label: 'Homes', value: '10K+', icon: Shield },
      { label: 'CO2 Saved', value: '50K tons', icon: Award },
    ],
    uniqueFeature: { title: 'ROI Calculator', description: 'See your savings in real-time', icon: Calculator },
  },
  pool: {
    name: 'Paradise Pools',
    tagline: 'Your Backyard Paradise Awaits',
    description: 'Custom luxury pool construction creating stunning outdoor oases for the ultimate home experience.',
    image: poolImg,
    accentColor: 'from-teal-400 to-cyan-500',
    accentColorDark: 'bg-teal-500',
    services: ['Custom Pools', 'Spas & Hot Tubs', 'Water Features', 'Pool Renovations', 'Outdoor Kitchens'],
    features: ['3D Design', 'Financing Options', 'Warranty Included', 'Weekly Maintenance'],
    layoutStyle: 'modern',
    uniqueFeature: { title: 'Design Studio', description: 'Visualize your dream pool in 3D', icon: Sparkles },
  },
};

const DemoSite = () => {
  const { trade } = useParams<{ trade: string }>();
  const site = trade ? demoSites[trade as keyof typeof demoSites] : null;
  
  // Scroll to top when demo loads
  useScrollToTop();

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

  const isCreative = site.layoutStyle === 'creative';
  const isTechnical = site.layoutStyle === 'technical';
  const isModern = site.layoutStyle === 'modern';

  return (
    <div className="min-h-screen bg-background">
      {/* Back Link */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/#portfolio">
          <Button variant="outline" className="glass group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Hardhat Hosting
          </Button>
        </Link>
      </div>

      {/* Demo Banner */}
      <div className={`${site.accentColorDark} text-white text-center py-2 text-sm font-medium`}>
        🎨 This is a demo website preview • <Link to="/#contact" className="underline font-bold hover:no-underline">Get this website for your business →</Link>
      </div>

      {/* Hero Section - Varies by layout style */}
      <section className={`relative ${isCreative ? 'min-h-screen' : 'min-h-[80vh]'} flex items-center`}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={site.image}
            alt={site.name}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${site.accentColor} ${isCreative ? 'opacity-70' : 'opacity-80'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <AnimatedSection animation={isCreative ? 'blur-in' : 'fade-up'} className={isCreative ? 'text-center max-w-4xl mx-auto' : 'max-w-3xl'}>
            {isCreative && (
              <span className="inline-block text-white/80 uppercase tracking-[0.3em] text-sm mb-4">
                {site.layoutStyle === 'creative' ? 'Design Studio' : 'Innovation'}
              </span>
            )}
            <h1 className={`font-display text-white mb-4 drop-shadow-2xl ${isCreative ? 'text-6xl lg:text-8xl xl:text-9xl' : 'text-5xl lg:text-7xl xl:text-8xl'}`}>
              {site.name}
            </h1>
            <p className={`text-white/90 mb-8 ${isCreative ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>
              {site.tagline}
            </p>
            <div className={`flex flex-wrap gap-4 ${isCreative ? 'justify-center' : ''}`}>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 glow text-lg px-8 group">
                <Phone className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                {isTechnical ? 'Schedule Consultation' : 'Call Now'}
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-lg px-8">
                {isCreative ? 'View Portfolio' : isTechnical ? 'Request Proposal' : 'Get Free Quote'}
              </Button>
            </div>
          </AnimatedSection>

          {/* Stats for technical/modern layouts */}
          {(isTechnical || isModern) && site.stats && (
            <AnimatedSection animation="fade-up" delay={300} className="mt-16">
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto lg:mx-0">
                {site.stats.map((stat, index) => (
                  <div key={stat.label} className="glass rounded-xl p-4 text-center" style={{ animationDelay: `${index * 100}ms` }}>
                    <stat.icon className="w-6 h-6 text-white/80 mx-auto mb-2" />
                    <div className="font-display text-2xl lg:text-3xl text-white">{stat.value}</div>
                    <div className="text-white/70 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-card border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {site.features.map((feature, index) => (
              <AnimatedSection key={feature} animation="fade-up" delay={index * 50} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Feature Section for applicable layouts */}
      {site.uniqueFeature && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <AnimatedSection animation="scale-in" className="max-w-xl mx-auto text-center">
              <div className={`w-20 h-20 ${site.accentColorDark} rounded-2xl flex items-center justify-center mx-auto mb-6 glow`}>
                <site.uniqueFeature.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-display text-3xl text-foreground mb-3">{site.uniqueFeature.title}</h3>
              <p className="text-muted-foreground text-lg">{site.uniqueFeature.description}</p>
              <Button className="mt-6 glow">Try It Now</Button>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fade-up" className="max-w-4xl mx-auto text-center">
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
            
            {/* Stats - Only show if not already shown in hero */}
            {!site.stats && (
              <div className="grid grid-cols-3 gap-6 mt-12">
                <AnimatedSection animation="fade-up" delay={0} className="glass rounded-xl p-6">
                  <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="font-display text-3xl text-foreground">25+</div>
                  <div className="text-muted-foreground text-sm">Years Experience</div>
                </AnimatedSection>
                <AnimatedSection animation="fade-up" delay={100} className="glass rounded-xl p-6">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="font-display text-3xl text-foreground">1000+</div>
                  <div className="text-muted-foreground text-sm">Projects Completed</div>
                </AnimatedSection>
                <AnimatedSection animation="fade-up" delay={200} className="glass rounded-xl p-6">
                  <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="font-display text-3xl text-foreground">100%</div>
                  <div className="text-muted-foreground text-sm">Satisfaction Rate</div>
                </AnimatedSection>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 lg:py-28 bg-secondary/50">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-4">
              Our <span className="text-gradient">Services</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer a comprehensive range of professional services to meet all your needs.
            </p>
          </AnimatedSection>
          <div className={`grid gap-6 max-w-5xl mx-auto ${isCreative ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {site.services.map((service, index) => (
              <AnimatedSection
                key={service}
                animation={isCreative ? 'scale-in' : 'fade-up'}
                delay={index * 100}
              >
                <div className={`glass rounded-xl p-6 card-3d group h-full ${isCreative ? 'text-center' : ''}`}>
                  <div className={`w-12 h-12 rounded-lg ${site.accentColorDark} bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isCreative ? 'mx-auto' : ''}`}>
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">{service}</h3>
                  <p className="text-muted-foreground text-sm">
                    Professional {service.toLowerCase()} services tailored to your specific needs.
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fade-up">
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
                {[
                  { icon: Phone, title: 'Call Us', value: '(909) 555-1234' },
                  { icon: Mail, title: 'Email Us', value: 'info@example.com' },
                  { icon: MapPin, title: 'Visit Us', value: 'Rancho Cucamonga, CA' },
                ].map((contact, index) => (
                  <AnimatedSection key={contact.title} animation="fade-up" delay={index * 100} className="flex flex-col items-center gap-3">
                    <div className={`${site.accentColorDark} p-5 rounded-full glow group-hover:scale-110 transition-transform`}>
                      <contact.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-display text-lg text-foreground">{contact.title}</h4>
                    <p className="text-muted-foreground">{contact.value}</p>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={site.image}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${site.accentColor} opacity-90`} />
        </div>
        <AnimatedSection animation="fade-up" className="relative container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Want a Website Like This?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Hardhat Hosting can build you a professional website just like this one. 
            Get started today and grow your business online.
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-10 group">
              Get This Website
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </AnimatedSection>
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
