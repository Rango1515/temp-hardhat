import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, StatCounter, ContactForm, ProcessStep } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Sun, Phone, Leaf, Calculator, CheckCircle2, Home, DollarSign, Shield, Zap, TrendingUp } from 'lucide-react';
import solarImg from '@/assets/demo-solar.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Why Solar', id: 'why' },
  { name: 'Services', id: 'services' },
  { name: 'Process', id: 'process' },
  { name: 'Contact', id: 'contact' },
];

const SolarDemo = () => {
  const [activePage, setActivePage] = useState('home');
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
        <Sun className="w-7 h-7 text-white" />
      </div>
      <div>
        <span className="text-2xl font-bold text-slate-800">SunPower</span>
        <span className="text-2xl font-light text-amber-500"> Solar</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white text-slate-900">
      <DemoBanner color="bg-gradient-to-r from-amber-500 to-orange-500" textColor="text-white" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-amber-500" theme="light" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Bright Sunny Style */}
          <section className="relative min-h-[90vh] overflow-hidden">
            <div className="absolute inset-0">
              <img src={solarImg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-amber-50/85 to-transparent" />
            </div>
            
            <div className="relative container mx-auto px-6 py-32 min-h-[90vh] flex items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-5 py-2 mb-8">
                  <Leaf className="w-4 h-4" />
                  <span className="font-medium text-sm">$0 Down Options Available</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-800">
                  Power Your Home<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">With Sunshine</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-lg">
                  Go solar and start saving from day one. Clean, renewable energy 
                  with $0 down financing and a 25-year warranty.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-12">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 shadow-lg shadow-amber-500/30">
                    <Calculator className="w-5 h-5 mr-2" /> Get Free Quote
                  </Button>
                  <Button variant="outline" className="border-slate-300 hover:bg-white px-8 py-6">
                    <Phone className="w-5 h-5 mr-2" /> (888) 555-SOLAR
                  </Button>
                </div>
                
                {/* Savings calculator preview */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-amber-100 max-w-md">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Average Savings Calculator
                  </h3>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600">Monthly Electric Bill</span>
                    <span className="font-bold text-xl">$250</span>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800">Estimated 25-Year Savings</span>
                      <span className="font-bold text-2xl text-green-600">$45,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Stats */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatCounter value="10,000+" label="Homes Powered" icon={<Home className="w-6 h-6 text-amber-500" />} theme="light" />
                <StatCounter value="$50M+" label="Customer Savings" icon={<DollarSign className="w-6 h-6 text-green-500" />} theme="light" />
                <StatCounter value="25 Years" label="Warranty" icon={<Shield className="w-6 h-6 text-blue-500" />} theme="light" />
                <StatCounter value="50MW" label="Installed" icon={<Zap className="w-6 h-6 text-amber-500" />} theme="light" />
              </div>
            </div>
          </section>
          
          {/* Benefits */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Why Go <span className="text-amber-500">Solar</span>?</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">Join thousands of homeowners saving money while helping the environment.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { icon: <DollarSign className="w-8 h-8" />, title: 'Save Money', desc: 'Reduce your energy bills by up to 90% or more.' },
                  { icon: <Leaf className="w-8 h-8" />, title: 'Go Green', desc: 'Reduce your carbon footprint with clean energy.' },
                  { icon: <TrendingUp className="w-8 h-8" />, title: 'Add Value', desc: 'Increase your home value by an average of 4%.' },
                  { icon: <Shield className="w-8 h-8" />, title: 'Energy Freedom', desc: 'Protect against rising utility costs.' },
                ].map((b, i) => (
                  <div key={i} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500">
                      {b.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                    <p className="text-slate-600">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-slate-900 text-white">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold">Customer <span className="text-amber-400">Stories</span></h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Our electric bill went from $400 to $15. The system pays for itself!", author: "Mike & Sarah Thompson", role: "Homeowners, Riverside" },
                  { quote: "Best investment we've made in our home. Wish we did it years ago.", author: "The Garcia Family", role: "Homeowners, Corona" },
                  { quote: "Professional installation and great customer service throughout.", author: "Jennifer Lee", role: "Homeowner, Temecula" },
                ].map((t, i) => (
                  <TestimonialCard key={i} {...t} theme="dark" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* WHY SOLAR PAGE */}
      {activePage === 'why' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Why <span className="text-amber-500">Solar</span>?</h1>
              <p className="text-slate-600 max-w-2xl mx-auto">The benefits of switching to solar energy go beyond just saving money.</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
              <div>
                <img src={solarImg} alt="" className="w-full rounded-2xl shadow-xl" />
              </div>
              <div className="space-y-8">
                {[
                  { title: 'Massive Savings', desc: 'The average homeowner saves $30,000+ over 25 years. With rising utility rates, your savings only increase.' },
                  { title: 'Tax Credits', desc: 'Take advantage of the 30% federal tax credit, plus state and local incentives.' },
                  { title: 'Energy Independence', desc: 'Generate your own power and protect yourself from utility rate hikes.' },
                  { title: 'Environmental Impact', desc: 'A typical home solar system prevents 100+ tons of CO2 over its lifetime.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Environmental Impact */}
            <div className="bg-green-50 rounded-3xl p-12 text-center">
              <Leaf className="w-16 h-16 mx-auto mb-6 text-green-500" />
              <h2 className="text-3xl font-bold mb-4">Your Environmental Impact</h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">When you switch to solar, you're not just saving money—you're making a real difference.</p>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <p className="text-4xl font-bold text-green-600">100 tons</p>
                  <p className="text-slate-600">CO2 prevented over 25 years</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-600">2,000+</p>
                  <p className="text-slate-600">Trees worth of carbon offset</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-600">40,000</p>
                  <p className="text-slate-600">Miles of driving offset/year</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* SERVICES PAGE */}
      {activePage === 'services' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Our <span className="text-amber-500">Services</span></h1>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {[
                { title: 'Residential Solar', desc: 'Custom solar systems designed for your home. We handle everything from design to installation and monitoring.', features: ['Free home assessment', 'Custom system design', 'Professional installation', 'System monitoring', '25-year warranty'] },
                { title: 'Battery Storage', desc: 'Store excess energy for use at night or during outages with our battery backup solutions.', features: ['Tesla Powerwall', 'Whole-home backup', 'Time-of-use optimization', 'App monitoring', 'Seamless integration'] },
                { title: 'EV Charging', desc: 'Charge your electric vehicle with solar power from your own roof.', features: ['Level 2 chargers', 'Smart scheduling', 'Solar integration', 'Any EV compatible', 'Professional install'] },
                { title: 'Commercial Solar', desc: 'Large-scale solar solutions for businesses looking to reduce operating costs.', features: ['Free energy audit', 'Custom financing', 'Project management', 'Monitoring & maintenance', 'Tax credit assistance'] },
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-amber-100">
                  <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                  <p className="text-slate-600 mb-6">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-6" onClick={() => setActivePage('contact')}>
                Get Your Free Quote
              </Button>
            </div>
          </div>
        </section>
      )}
      
      {/* PROCESS PAGE */}
      {activePage === 'process' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Our <span className="text-amber-500">Process</span></h1>
              <p className="text-slate-600 max-w-2xl mx-auto">Going solar is easier than you think. Here's how it works:</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-12">
              <ProcessStep number="01" title="Free Consultation" description="We analyze your energy bills, assess your roof, and design a custom system for your home." theme="light" accentColor="text-amber-500" />
              <ProcessStep number="02" title="Custom Proposal" description="Receive a detailed proposal with system size, savings estimate, and financing options." theme="light" accentColor="text-amber-500" />
              <ProcessStep number="03" title="Permitting" description="We handle all permits and paperwork with your city and utility company." theme="light" accentColor="text-amber-500" />
              <ProcessStep number="04" title="Installation" description="Our certified installers complete your system in just 1-2 days." theme="light" accentColor="text-amber-500" />
              <ProcessStep number="05" title="Inspection" description="We coordinate final inspections and utility approval." theme="light" accentColor="text-amber-500" />
              <ProcessStep number="06" title="Power On!" description="Flip the switch and start generating your own clean energy!" theme="light" accentColor="text-amber-500" />
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-slate-600 mb-6">Average time from signing to power-on: 4-8 weeks</p>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-6" onClick={() => setActivePage('contact')}>
                Start Your Solar Journey
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
                <h1 className="text-5xl font-bold mb-6">Get Your <span className="text-amber-500">Free Quote</span></h1>
                <p className="text-slate-600 mb-12">
                  Ready to start saving? Get a custom solar quote designed specifically for your home.
                  No pressure, no obligation.
                </p>
                
                <div className="bg-amber-50 rounded-2xl p-8 mb-8">
                  <h3 className="font-bold text-lg mb-4">What You'll Get:</h3>
                  <ul className="space-y-3">
                    {['Custom system design for your home', 'Estimated energy production', 'Savings over 25 years', 'Financing options & incentives', 'Environmental impact report'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-lg">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-7 h-7 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Call us directly</p>
                    <p className="text-xl font-bold">(888) 555-SOLAR</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold mb-8">Request Your Free Quote</h2>
                <ContactForm theme="light" accentColor="bg-gradient-to-r from-amber-500 to-orange-500" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="SunPower Solar" 
        theme="light" 
        accentColor="bg-gradient-to-r from-amber-500 to-orange-500" 
        phone="(888) 555-SOLAR"
        email="hello@sunpowersolar.com"
        address="Inland Empire, CA"
        services={['Residential Solar', 'Commercial Solar', 'Battery Storage', 'EV Charging']}
      />
    </div>
  );
};

export default SolarDemo;
