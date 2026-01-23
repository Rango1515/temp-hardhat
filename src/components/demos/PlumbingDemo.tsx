import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, StatCounter, ContactForm, FAQItem, ProcessStep } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Droplets, Phone, CheckCircle2, Clock, Shield, Star, Wrench, Thermometer, AlertTriangle, Gauge } from 'lucide-react';
import plumbingImg from '@/assets/demo-plumbing.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Services', id: 'services' },
  { name: 'About', id: 'about' },
  { name: 'Areas', id: 'areas' },
  { name: 'Contact', id: 'contact' },
];

const PlumbingDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
        <Droplets className="w-6 h-6 text-white" />
      </div>
      <div>
        <span className="text-xl font-bold text-white">Crystal Clear</span>
        <span className="block text-sm text-blue-400 -mt-1">Plumbing</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <DemoBanner color="bg-blue-600" textColor="text-white" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-blue-600" theme="dark" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Trust-focused blue gradient */}
          <section className="relative min-h-[90vh] bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <img src={plumbingImg} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="relative container mx-auto px-6 py-32 min-h-[90vh] flex items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-5 py-2 mb-6">
                  <Droplets className="w-5 h-5" />
                  <span className="font-medium">Your Local Plumbing Experts</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                  Crystal Clear<br />
                  Plumbing
                </h1>
                <p className="text-xl text-blue-100 mb-10">
                  Fast, reliable plumbing services for your home or business. 
                  Licensed, insured, and available 24/7 for emergencies.
                </p>
                <div className="flex flex-wrap gap-4 mb-12">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6">
                    <Phone className="w-5 h-5 mr-2" /> (555) 123-PIPE
                  </Button>
                  <Button variant="outline" className="border-white/30 hover:bg-white/10 px-8 py-6" onClick={() => setActivePage('services')}>
                    Our Services
                  </Button>
                </div>
                
                {/* Trust badges */}
                <div className="flex flex-wrap gap-6">
                  {['24/7 Emergency', 'Licensed & Insured', 'Free Estimates', 'Satisfaction Guaranteed'].map((badge) => (
                    <div key={badge} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-300" />
                      <span className="text-blue-100">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          
          {/* Emergency Banner */}
          <section className="py-6 bg-red-600 text-white">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-bold text-lg">Plumbing Emergency? We're Available 24/7!</span>
              </div>
              <Button className="bg-white text-red-600 hover:bg-red-50 font-bold">
                Call Now: (555) 123-PIPE
              </Button>
            </div>
          </section>
          
          {/* Services Preview */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Our <span className="text-blue-600">Services</span></h2>
                <p className="text-slate-600">Professional plumbing solutions for every need.</p>
              </div>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                  { icon: <Wrench />, title: 'Drain Cleaning' },
                  { icon: <Thermometer />, title: 'Water Heaters' },
                  { icon: <Gauge />, title: 'Leak Detection' },
                  { icon: <Droplets />, title: 'Pipe Repair' },
                  { icon: <Shield />, title: 'Sewer Lines' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-6 text-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {s.icon}
                    </div>
                    <h3 className="font-bold">{s.title}</h3>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setActivePage('services')}>
                  View All Services
                </Button>
              </div>
            </div>
          </section>
          
          {/* Stats */}
          <section className="py-16 bg-slate-900 text-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatCounter value="15+" label="Years Experience" theme="dark" />
                <StatCounter value="10,000+" label="Jobs Completed" theme="dark" />
                <StatCounter value="4.9★" label="Google Rating" theme="dark" />
                <StatCounter value="1 Hour" label="Response Time" theme="dark" />
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold">What Customers <span className="text-blue-600">Say</span></h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Called at 11pm with a burst pipe. They were here in 30 minutes! Saved our floors.", author: "Jennifer M.", role: "Homeowner" },
                  { quote: "Fair pricing, great work. They're now our go-to plumber for everything.", author: "Robert K.", role: "Property Manager" },
                  { quote: "Professional, clean, and explained everything. Fixed our water heater same day.", author: "Lisa T.", role: "Homeowner" },
                ].map((t, i) => (
                  <TestimonialCard key={i} {...t} theme="light" />
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
              <h1 className="text-5xl font-bold mb-4">Our <span className="text-blue-600">Services</span></h1>
              <p className="text-slate-600 max-w-2xl mx-auto">Complete plumbing solutions for residential and commercial properties.</p>
            </div>
            
            <div className="space-y-8">
              {[
                { title: 'Drain Cleaning', desc: 'Professional drain and sewer cleaning using advanced hydro-jetting technology.', items: ['Kitchen drains', 'Bathroom drains', 'Main sewer line', 'Floor drains', 'Storm drains'] },
                { title: 'Water Heater Services', desc: 'Installation, repair, and maintenance of all types of water heaters.', items: ['Tank water heaters', 'Tankless systems', 'Heat pump water heaters', 'Repairs & maintenance', 'Same-day installation'] },
                { title: 'Leak Detection & Repair', desc: 'Advanced leak detection technology to find hidden leaks without damage.', items: ['Electronic detection', 'Thermal imaging', 'Slab leak repair', 'Pipe rerouting', 'Insurance claim assistance'] },
                { title: 'Pipe Services', desc: 'Complete pipe installation, repair, and repiping services.', items: ['Pipe repair', 'Whole-home repiping', 'Gas line installation', 'Water line repair', 'Backflow prevention'] },
              ].map((service, i) => (
                <div key={i} className="grid lg:grid-cols-2 gap-8 p-8 bg-slate-50 rounded-2xl">
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-slate-600 mb-4">{service.desc}</p>
                    <Button className="bg-blue-600 text-white" onClick={() => setActivePage('contact')}>Get Quote</Button>
                  </div>
                  <div>
                    <ul className="grid grid-cols-2 gap-3">
                      {service.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* ABOUT PAGE */}
      {activePage === 'about' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
              <div>
                <h1 className="text-5xl font-bold mb-6">About <span className="text-blue-600">Crystal Clear</span></h1>
                <p className="text-slate-600 text-lg mb-6">
                  For over 15 years, Crystal Clear Plumbing has been the trusted choice for 
                  homeowners and businesses throughout the region. We're a family-owned company 
                  that treats every customer like a neighbor.
                </p>
                <p className="text-slate-600 mb-8">
                  Our team of licensed plumbers is trained on the latest techniques and 
                  technologies. We take pride in our work and stand behind it with our 
                  satisfaction guarantee.
                </p>
              </div>
              <img src={plumbingImg} alt="" className="w-full aspect-[4/3] object-cover rounded-2xl" />
            </div>
            
            {/* Our Process */}
            <div className="max-w-3xl mx-auto mb-24">
              <h2 className="text-3xl font-bold text-center mb-12">How We <span className="text-blue-600">Work</span></h2>
              <div className="space-y-8">
                <ProcessStep number="1" title="Call Us" description="Contact us by phone or online. We're available 24/7 for emergencies." theme="light" accentColor="text-blue-600" />
                <ProcessStep number="2" title="Diagnose" description="Our technician arrives promptly, diagnoses the issue, and explains your options." theme="light" accentColor="text-blue-600" />
                <ProcessStep number="3" title="Approve" description="You approve the work upfront with transparent, no-surprise pricing." theme="light" accentColor="text-blue-600" />
                <ProcessStep number="4" title="Complete" description="We complete the work efficiently and clean up when we're done." theme="light" accentColor="text-blue-600" />
              </div>
            </div>
            
            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Common <span className="text-blue-600">Questions</span></h2>
              {[
                { q: 'Do you offer 24/7 emergency service?', a: 'Yes! We have plumbers on call around the clock for plumbing emergencies. No extra charge for nights or weekends.' },
                { q: 'Are your plumbers licensed?', a: 'Absolutely. All our plumbers are fully licensed, bonded, and insured. We also do background checks on all employees.' },
                { q: 'Do you offer free estimates?', a: 'Yes, we offer free estimates for most jobs. For diagnostic work (like leak detection), there is a service fee that is waived if you proceed with repairs.' },
                { q: 'What forms of payment do you accept?', a: 'We accept all major credit cards, checks, and cash. We also offer financing options for larger projects.' },
              ].map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} theme="light" />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* AREAS PAGE */}
      {activePage === 'areas' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Areas We <span className="text-blue-600">Serve</span></h1>
              <p className="text-slate-600 max-w-2xl mx-auto">We provide plumbing services throughout the region with fast response times.</p>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {['Rancho Cucamonga', 'Ontario', 'Fontana', 'Upland', 'Claremont', 'Pomona', 'San Dimas', 'La Verne', 'Montclair', 'Chino', 'Chino Hills', 'Corona'].map((city) => (
                <div key={city} className="bg-slate-50 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors cursor-pointer">
                  <span className="font-medium">{city}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Don't see your city?</h2>
              <p className="text-slate-600 mb-6">We may still serve your area! Give us a call to find out.</p>
              <Button className="bg-blue-600 text-white">
                <Phone className="w-5 h-5 mr-2" /> Call (555) 123-PIPE
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
                <h1 className="text-5xl font-bold mb-6">Contact <span className="text-blue-600">Us</span></h1>
                <p className="text-slate-600 mb-12">
                  Ready to schedule service? Have questions? We're here to help.
                </p>
                
                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Call Us 24/7</p>
                      <p className="text-xl font-bold">(555) 123-PIPE</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Office Hours</p>
                      <p className="font-bold">Mon-Sat: 7am - 7pm</p>
                      <p className="text-sm text-blue-600">24/7 Emergency Service</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-8 md:p-12 rounded-2xl">
                <h2 className="text-2xl font-bold mb-8">Request Service</h2>
                <ContactForm theme="light" accentColor="bg-blue-600" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="Crystal Clear Plumbing" 
        theme="light" 
        accentColor="bg-blue-600" 
        phone="(555) 123-PIPE"
        email="service@crystalclearplumbing.com"
        address="Rancho Cucamonga, CA"
        services={['Drain Cleaning', 'Water Heaters', 'Leak Detection', 'Pipe Repair', 'Sewer Lines', 'Emergency']}
      />
    </div>
  );
};

export default PlumbingDemo;
