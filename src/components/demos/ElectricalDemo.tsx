import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, ServiceCard, StatCounter, ContactForm, FAQItem, PricingCard, ProcessStep } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Zap, Phone, Shield, Clock, CheckCircle2, Wrench, Home, Building, Lightbulb, Battery, Plug, AlertTriangle } from 'lucide-react';
import electricalImg from '@/assets/demo-electrical.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Services', id: 'services' },
  { name: 'Why Us', id: 'about' },
  { name: 'Pricing', id: 'pricing' },
  { name: 'Contact', id: 'contact' },
];

const ElectricalDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
        <Zap className="w-6 h-6 text-slate-900" />
      </div>
      <div>
        <span className="text-xl font-black text-white">VOLT</span>
        <span className="text-xl font-light text-yellow-500"> ELECTRIC</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DemoBanner color="bg-yellow-500" textColor="text-slate-900" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-yellow-500" theme="dark" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Cyberpunk Neon Style */}
          <section className="relative min-h-[90vh] overflow-hidden">
            <div className="absolute inset-0">
              <img src={electricalImg} alt="" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(rgba(250,204,21,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.2) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
              }} />
            </div>
            
            <div className="relative container mx-auto px-6 py-32 min-h-[90vh] flex items-center justify-center text-center">
              <div>
                {/* Emergency badge */}
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-6 py-2 mb-8 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-400 font-semibold">24/7 EMERGENCY SERVICE AVAILABLE</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black mb-6">
                  <span className="text-yellow-500 drop-shadow-[0_0_40px_rgba(250,204,21,0.5)]">VOLT</span> ELECTRIC
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto">
                  Powering Los Angeles homes and businesses with cutting-edge electrical solutions. 
                  Licensed. Insured. Available 24/7.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                  <Button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-10 py-6 text-lg shadow-[0_0_40px_rgba(250,204,21,0.3)]">
                    <Phone className="w-5 h-5 mr-2" /> CALL NOW
                  </Button>
                  <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 px-10 py-6 text-lg">
                    Get Free Quote
                  </Button>
                </div>
                
                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-4">
                  {['Same Day Service', 'Upfront Pricing', 'Licensed & Insured', '100% Satisfaction'].map(feature => (
                    <div key={feature} className="flex items-center gap-2 bg-slate-800/50 rounded-full px-5 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          
          {/* Stats Bar */}
          <section className="py-12 bg-yellow-500 text-slate-900">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatCounter value="10,000+" label="Happy Customers" theme="light" />
                <StatCounter value="25+" label="Years Experience" theme="light" />
                <StatCounter value="A+" label="BBB Rating" theme="light" />
                <StatCounter value="24/7" label="Emergency Service" theme="light" />
              </div>
            </div>
          </section>
          
          {/* Services Preview */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Our <span className="text-yellow-500">Services</span></h2>
                <p className="text-slate-400 max-w-2xl mx-auto">From simple repairs to complete rewiring, we handle it all with expertise and professionalism.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: <Zap className="w-6 h-6 text-slate-900" />, title: 'Electrical Repairs', desc: 'Fast, reliable fixes for any electrical issue in your home or business.' },
                  { icon: <Home className="w-6 h-6 text-slate-900" />, title: 'Panel Upgrades', desc: 'Modernize your electrical panel for safety and increased capacity.' },
                  { icon: <Battery className="w-6 h-6 text-slate-900" />, title: 'EV Charger Install', desc: 'Charge your electric vehicle at home with professional installation.' },
                  { icon: <Lightbulb className="w-6 h-6 text-slate-900" />, title: 'Lighting Design', desc: 'Transform your space with beautiful, functional lighting solutions.' },
                  { icon: <Building className="w-6 h-6 text-slate-900" />, title: 'Commercial Services', desc: 'Complete electrical solutions for businesses of all sizes.' },
                  { icon: <Shield className="w-6 h-6 text-slate-900" />, title: 'Safety Inspections', desc: 'Comprehensive inspections to keep your property safe and code-compliant.' },
                ].map((s, i) => (
                  <ServiceCard key={i} icon={s.icon} title={s.title} description={s.desc} theme="dark" accentColor="bg-yellow-500" />
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Button variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-slate-900" onClick={() => setActivePage('services')}>
                  View All Services
                </Button>
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">What Our <span className="text-yellow-500">Customers</span> Say</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Fast response time and excellent work. They fixed our panel issue the same day!", author: "Mike Johnson", role: "Homeowner, Pasadena" },
                  { quote: "The team was professional, clean, and explained everything. Highly recommend!", author: "Sarah Williams", role: "Business Owner" },
                  { quote: "Best electricians we've ever used. Fair pricing and outstanding service.", author: "David Chen", role: "Property Manager" },
                ].map((t, i) => (
                  <TestimonialCard key={i} {...t} theme="dark" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* SERVICES PAGE */}
      {activePage === 'services' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Our <span className="text-yellow-500">Services</span></h1>
              <p className="text-slate-400 max-w-2xl mx-auto">Complete electrical solutions for residential and commercial properties.</p>
            </div>
            
            {/* Residential */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-8">
                <Home className="w-8 h-8 text-yellow-500" />
                <h2 className="text-3xl font-bold">Residential Services</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Outlet & Switch Installation', 'Lighting Installation', 'Ceiling Fan Install', 'Panel Upgrades', 'Whole House Rewiring', 'EV Charger Installation', 'Generator Installation', 'Surge Protection', 'Smart Home Wiring'].map((s, i) => (
                  <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                      <span className="text-lg group-hover:text-yellow-500 transition-colors">{s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Commercial */}
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-8">
                <Building className="w-8 h-8 text-yellow-500" />
                <h2 className="text-3xl font-bold">Commercial Services</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Office Wiring', 'Industrial Electrical', 'Parking Lot Lighting', 'Emergency Lighting', 'Data & Communication', 'Fire Alarm Systems', 'Energy Audits', 'Maintenance Contracts', 'Code Compliance'].map((s, i) => (
                  <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                      <span className="text-lg group-hover:text-yellow-500 transition-colors">{s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Emergency Section */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 md:p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">24/7 Emergency Service</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Electrical emergencies can't wait. Our team is available around the clock 
                to handle urgent situations safely and quickly.
              </p>
              <Button className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-6">
                <Phone className="w-5 h-5 mr-2" /> Call Emergency Line
              </Button>
            </div>
          </div>
        </section>
      )}
      
      {/* ABOUT/WHY US PAGE */}
      {activePage === 'about' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Why Choose <span className="text-yellow-500">Volt Electric</span>?</h1>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
              <div>
                <img src={electricalImg} alt="" className="w-full rounded-2xl" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">25+ Years of Excellence</h2>
                <p className="text-slate-400 mb-8">
                  Since 1998, Volt Electric has been the trusted choice for electrical services in Los Angeles. 
                  Our team of certified electricians brings expertise, professionalism, and attention to detail 
                  to every job, big or small.
                </p>
                
                <div className="space-y-6">
                  <ProcessStep number="01" title="Licensed & Certified" description="All our electricians are fully licensed and regularly trained on the latest codes and technologies." theme="dark" accentColor="text-yellow-500" />
                  <ProcessStep number="02" title="Upfront Pricing" description="No surprises. We provide detailed quotes before any work begins, so you know exactly what to expect." theme="dark" accentColor="text-yellow-500" />
                  <ProcessStep number="03" title="Quality Guaranteed" description="We stand behind our work with a 100% satisfaction guarantee and warranty on all services." theme="dark" accentColor="text-yellow-500" />
                </div>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked <span className="text-yellow-500">Questions</span></h2>
              {[
                { q: 'Are you licensed and insured?', a: 'Yes! We are fully licensed, bonded, and insured. Our license number is displayed on all vehicles and documentation.' },
                { q: 'Do you offer free estimates?', a: 'Absolutely. We provide free, no-obligation estimates for most projects. For complex commercial work, we may charge a consultation fee that\'s applied to the project if you proceed.' },
                { q: 'What areas do you serve?', a: 'We serve the greater Los Angeles area including Pasadena, Glendale, Burbank, Beverly Hills, Santa Monica, and surrounding communities.' },
                { q: 'Do you offer financing?', a: 'Yes, we offer flexible financing options for larger projects. Ask about our 0% interest plans for qualified customers.' },
              ].map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} theme="dark" />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* PRICING PAGE */}
      {activePage === 'pricing' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Transparent <span className="text-yellow-500">Pricing</span></h1>
              <p className="text-slate-400 max-w-2xl mx-auto">No hidden fees. No surprises. Just honest, upfront pricing.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard 
                title="Service Call" 
                price="$89" 
                period="/visit"
                features={['Diagnostic assessment', 'Written estimate', 'Same-day availability', 'Applied to repairs']}
                theme="dark"
                accentColor="bg-yellow-500"
              />
              <PricingCard 
                title="Maintenance Plan" 
                price="$199" 
                period="/year"
                features={['Annual safety inspection', 'Priority scheduling', '10% off all repairs', '24/7 emergency line', 'No overtime charges']}
                isPopular
                theme="dark"
                accentColor="bg-yellow-500"
              />
              <PricingCard 
                title="Commercial" 
                price="Custom" 
                period=" quote"
                features={['Tailored solutions', 'Project management', 'Flexible scheduling', 'Maintenance contracts', 'Dedicated support']}
                theme="dark"
                accentColor="bg-yellow-500"
              />
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-slate-400 mb-6">Need a custom quote? Contact us for a free estimate.</p>
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-8" onClick={() => setActivePage('contact')}>
                Get Free Estimate
              </Button>
            </div>
          </div>
        </section>
      )}
      
      {/* CONTACT PAGE */}
      {activePage === 'contact' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h1 className="text-5xl font-bold mb-6">Get in <span className="text-yellow-500">Touch</span></h1>
                <p className="text-slate-400 mb-12">
                  Ready to start your project? Have questions? We're here to help. 
                  Reach out and we'll get back to you within 1 business hour.
                </p>
                
                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Call or Text</p>
                      <p className="text-xl font-bold">(555) 123-VOLT</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Business Hours</p>
                      <p className="font-bold">Mon-Sat: 7am - 7pm</p>
                      <p className="text-sm text-yellow-500">24/7 Emergency Available</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <h3 className="font-bold text-yellow-500 mb-2">⚡ Quick Response Guarantee</h3>
                  <p className="text-slate-400">We respond to all inquiries within 1 hour during business hours. For emergencies, call our 24/7 hotline.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-8">Request a Free Quote</h2>
                <ContactForm theme="dark" accentColor="bg-yellow-500" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="Volt Electric Pro" 
        theme="dark" 
        accentColor="bg-yellow-500" 
        phone="(555) 123-VOLT"
        email="service@voltelectric.com"
        address="Los Angeles, CA"
        services={['Electrical Repairs', 'Panel Upgrades', 'EV Chargers', 'Lighting', 'Commercial', 'Emergency']}
      />
    </div>
  );
};

export default ElectricalDemo;
