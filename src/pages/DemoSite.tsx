import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle2, Clock, Shield, Award, Leaf, Calculator, Sparkles, Ruler, Play, ArrowRight, Hammer, Droplets, Sun, Thermometer, Home, Waves } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useSmoothScroll';

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

// ============ CONCRETE - Industrial Bold Style ============
const ConcreteDemo = () => (
  <div className="min-h-screen bg-zinc-900 text-zinc-100">
    <DemoBanner color="bg-zinc-800" />
    
    {/* Hero - Split diagonal */}
    <section className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute right-0 top-0 w-2/3 h-full">
          <img src={concreteImg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent" />
        </div>
        {/* Diagonal line decoration */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-amber-500/10 to-transparent" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1 bg-amber-500" />
            <span className="text-amber-500 uppercase tracking-[0.3em] text-sm font-bold">Est. 1995</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">
            SOLID<br />
            <span className="text-amber-500">FOUNDATION</span><br />
            CONCRETE
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-lg">
            Industrial-strength concrete solutions. From foundations to decorative finishes, 
            we build what lasts.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-8 py-6 text-lg">
              <Phone className="w-5 h-5 mr-2" /> Get Quote
            </Button>
            <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-8 py-6 text-lg">
              View Projects
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-800/90 backdrop-blur border-t border-zinc-700">
        <div className="container mx-auto px-6 py-6 flex flex-wrap justify-between gap-8">
          {[
            { value: '25+', label: 'Years Experience' },
            { value: '1000+', label: 'Projects Done' },
            { value: '100%', label: 'Satisfaction' },
            { value: '24/7', label: 'Support' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-amber-500">{stat.value}</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Services - Industrial cards */}
    <section className="py-24 bg-zinc-950">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-black mb-12 flex items-center gap-4">
          <Hammer className="w-10 h-10 text-amber-500" />
          WHAT WE BUILD
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
          {['Driveways & Patios', 'Foundations', 'Stamped Concrete', 'Concrete Repair', 'Commercial Flatwork', 'Retaining Walls'].map((service, i) => (
            <div key={service} className="bg-zinc-900 p-8 hover:bg-zinc-800 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-amber-500">
              <span className="text-amber-500/40 text-6xl font-black">0{i + 1}</span>
              <h3 className="text-2xl font-bold mt-4 group-hover:text-amber-500 transition-colors">{service}</h3>
              <p className="text-zinc-500 mt-2">Professional {service.toLowerCase()} built to last.</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Solid Foundation Concrete" />
  </div>
);

// ============ ELECTRICAL - Neon Tech Style ============
const ElectricalDemo = () => (
  <div className="min-h-screen bg-slate-950 text-white">
    <DemoBanner color="bg-yellow-500 text-slate-900" />
    
    {/* Hero - Glowing grid */}
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={electricalImg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(250,204,21,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center justify-center text-center">
        <div>
          {/* Glowing badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-6 py-2 mb-8">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-500 text-sm font-semibold">24/7 EMERGENCY SERVICE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6">
            <span className="text-yellow-500 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]">VOLT</span> ELECTRIC PRO
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Powering homes and businesses with cutting-edge electrical solutions. 
            Licensed. Insured. Always on call.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-10 py-6 text-lg shadow-[0_0_30px_rgba(250,204,21,0.3)]">
              <Phone className="w-5 h-5 mr-2" /> CALL NOW
            </Button>
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 px-10 py-6 text-lg">
              Schedule Service
            </Button>
          </div>
          
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {['Same Day Service', 'Upfront Pricing', 'Licensed Electricians', 'Satisfaction Guaranteed'].map(feature => (
              <div key={feature} className="flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Services - Glowing cards */}
    <section className="py-24 bg-slate-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-black text-center mb-16">
          OUR <span className="text-yellow-500">SERVICES</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Electrical Repairs', desc: 'Fast fixes for any electrical issue' },
            { icon: '🔌', title: 'Panel Upgrades', desc: 'Modernize your electrical system' },
            { icon: '🔋', title: 'EV Charger Install', desc: 'Charge your electric vehicle at home' },
            { icon: '💡', title: 'Lighting Design', desc: 'Beautiful, functional lighting solutions' },
            { icon: '🚨', title: 'Emergency Service', desc: '24/7 response for urgent needs' },
            { icon: '🏠', title: 'Home Automation', desc: 'Smart home electrical integration' },
          ].map(service => (
            <div key={service.title} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-yellow-500/50 transition-all hover:shadow-[0_0_30px_rgba(250,204,21,0.1)] group">
              <span className="text-4xl">{service.icon}</span>
              <h3 className="text-xl font-bold mt-4 group-hover:text-yellow-500 transition-colors">{service.title}</h3>
              <p className="text-slate-400 mt-2">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Volt Electric Pro" />
  </div>
);

// ============ ARCHITECTURE - Minimal Elegant Style ============
const ArchitectureDemo = () => (
  <div className="min-h-screen bg-white text-slate-900">
    <DemoBanner color="bg-slate-900 text-white" />
    
    {/* Hero - Full bleed minimal */}
    <section className="relative h-screen">
      <img src={architectureImg} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-12">
        <div className="container mx-auto">
          <p className="text-slate-500 uppercase tracking-[0.5em] mb-4">Architecture Studio</p>
          <h1 className="text-6xl md:text-8xl font-light tracking-tight">
            Blueprint<br />
            <span className="font-serif italic text-slate-600">Architecture</span>
          </h1>
        </div>
      </div>
    </section>

    {/* About - Clean split */}
    <section className="py-32">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-slate-400 uppercase tracking-widest text-sm">About Us</span>
            <h2 className="text-5xl font-light mt-4 mb-8 leading-tight">Where vision<br />meets <span className="font-serif italic">design</span></h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We create spaces that inspire, buildings that endure, and designs that define. 
              Our award-winning team brings over 30 years of architectural excellence to every project.
            </p>
            <div className="grid grid-cols-3 gap-8 mt-12">
              {[
                { value: '200+', label: 'Projects' },
                { value: '15', label: 'Awards' },
                { value: '30+', label: 'Years' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-4xl font-light">{stat.value}</div>
                  <div className="text-sm text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] bg-slate-100" />
            <div className="absolute -bottom-8 -left-8 w-2/3 aspect-square bg-slate-200" />
          </div>
        </div>
      </div>
    </section>

    {/* Services - Minimal list */}
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-light mb-16">Services</h2>
        <div className="space-y-0 border-t border-slate-200">
          {['Residential Design', 'Commercial Projects', 'Interior Architecture', 'Sustainable Design', '3D Visualization'].map((service, i) => (
            <div key={service} className="flex items-center justify-between py-8 border-b border-slate-200 group cursor-pointer hover:bg-white transition-colors px-4 -mx-4">
              <div className="flex items-center gap-8">
                <span className="text-slate-300 text-2xl font-light">0{i + 1}</span>
                <span className="text-2xl font-light group-hover:translate-x-2 transition-transform">{service}</span>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Blueprint Architecture" dark={false} />
  </div>
);

// ============ ENGINEERING - Technical Blueprint Style ============
const EngineeringDemo = () => (
  <div className="min-h-screen bg-slate-900 text-white font-mono">
    <DemoBanner color="bg-teal-500" />
    
    {/* Hero - Blueprint style */}
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314b8a6' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute inset-0">
        <img src={engineeringImg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/80" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6 text-teal-400">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
            <span className="uppercase tracking-[0.2em] text-sm">Structural & Civil Engineering</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            PRECISION<br />
            <span className="text-teal-400">ENGINEERING</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl font-sans">
            Engineering excellence built on science, innovation, and 30+ years of 
            experience. We solve complex structural challenges with precision.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-8 py-6">
              Request Proposal →
            </Button>
            <Button variant="outline" className="border-slate-600 hover:bg-slate-800 px-8 py-6">
              View Case Studies
            </Button>
          </div>
          
          {/* Tech specs */}
          <div className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-slate-700">
            {[
              { label: 'PE Licensed', value: 'YES' },
              { label: 'ISO Certified', value: '9001:2015' },
              { label: 'Engineers', value: '25+' },
            ].map(spec => (
              <div key={spec.label}>
                <div className="text-xs text-teal-400 uppercase tracking-wider">{spec.label}</div>
                <div className="text-xl mt-1">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Services - Tech cards */}
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-4 mb-12">
          <Ruler className="w-8 h-8 text-teal-400" />
          <h2 className="text-3xl font-bold">CAPABILITIES</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Structural Analysis', desc: 'Advanced FEA modeling and load analysis' },
            { title: 'Civil Engineering', desc: 'Site development and infrastructure design' },
            { title: 'Foundation Design', desc: 'Deep foundations and soil mechanics' },
            { title: 'Seismic Retrofitting', desc: 'Earthquake-resistant upgrades' },
          ].map((service, i) => (
            <div key={service.title} className="bg-slate-800/50 p-8 border border-slate-700 hover:border-teal-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-teal-400 text-sm">/{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-slate-400 font-sans text-sm">{service.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Precision Engineering" />
  </div>
);

// ============ INTERIOR - Luxe Magazine Style ============
const InteriorDemo = () => (
  <div className="min-h-screen bg-stone-50 text-stone-900">
    <DemoBanner color="bg-rose-400 text-white" />
    
    {/* Hero - Magazine layout */}
    <section className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-12 lg:p-20 order-2 lg:order-1">
        <div>
          <span className="text-rose-400 uppercase tracking-[0.3em] text-sm">Luxury Interiors</span>
          <h1 className="text-5xl md:text-7xl font-light mt-4 mb-8 leading-[0.9]">
            Studio<br />
            <span className="font-serif italic">Luxe</span><br />
            Interiors
          </h1>
          <p className="text-lg text-stone-500 mb-10 max-w-md">
            We create sophisticated spaces that reflect your unique style and elevate everyday living.
          </p>
          <Button className="bg-rose-400 hover:bg-rose-500 text-white px-10 py-6 rounded-none">
            Book Consultation
          </Button>
        </div>
      </div>
      <div className="relative order-1 lg:order-2 min-h-[50vh] lg:min-h-screen">
        <img src={interiorImg} alt="" className="w-full h-full object-cover" />
      </div>
    </section>

    {/* Services - Elegant grid */}
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-rose-400 uppercase tracking-[0.3em] text-sm">What We Offer</span>
          <h2 className="text-4xl font-light mt-4">Our Services</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-stone-200">
          {['Full Room Design', 'Color Consultation', 'Furniture Curation', 'Space Planning', 'Art Selection', 'Project Management'].map(service => (
            <div key={service} className="bg-stone-50 p-12 text-center hover:bg-rose-50 transition-colors group">
              <Sparkles className="w-8 h-8 text-rose-300 mx-auto mb-4 group-hover:text-rose-400 transition-colors" />
              <h3 className="text-xl mb-2">{service}</h3>
              <p className="text-stone-400 text-sm">Tailored solutions for your space</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Studio Luxe Interiors" dark={false} />
  </div>
);

// ============ LANDSCAPING - Natural Organic Style ============
const LandscapingDemo = () => (
  <div className="min-h-screen bg-stone-900 text-stone-100">
    <DemoBanner color="bg-emerald-600" />
    
    {/* Hero - Organic shapes */}
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={landscapingImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-stone-900/30" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-end pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-600/20 backdrop-blur border border-emerald-500/30 rounded-full px-5 py-2 mb-6">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm">Sustainable Landscaping</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Green Valley<br />
            <span className="text-emerald-400">Landscaping</span>
          </h1>
          <p className="text-xl text-stone-300 mb-10">
            Transform your outdoor space into a living masterpiece. 
            Eco-friendly designs that thrive in any climate.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6">
              Free Design Consultation
            </Button>
            <Button variant="outline" className="border-stone-600 text-white hover:bg-stone-800 px-8 py-6">
              View Gallery
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Features - Organic cards */}
    <section className="py-24 bg-stone-950">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🌿', title: 'Landscape Design', desc: 'Custom outdoor living spaces' },
            { icon: '🪨', title: 'Hardscaping', desc: 'Patios, walkways, and walls' },
            { icon: '💧', title: 'Irrigation', desc: 'Smart water management' },
            { icon: '🌳', title: 'Tree Services', desc: 'Planting and maintenance' },
          ].map(item => (
            <div key={item.title} className="bg-stone-900 rounded-3xl p-8 border border-stone-800 hover:border-emerald-500/50 transition-all">
              <span className="text-4xl">{item.icon}</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">{item.title}</h3>
              <p className="text-stone-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Green Valley Landscaping" />
  </div>
);

// ============ HVAC - Clean Technical Style ============
const HVACDemo = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <DemoBanner color="bg-cyan-500" />
    
    {/* Hero - Split modern */}
    <section className="min-h-screen grid lg:grid-cols-2">
      <div className="bg-slate-900 text-white flex items-center p-12 lg:p-20">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Thermometer className="w-6 h-6 text-cyan-400" />
            <span className="text-cyan-400 uppercase tracking-wider text-sm">Climate Control</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            COMFORT IN<br />
            <span className="text-cyan-400">EVERY SEASON</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10">
            Professional HVAC services for homes and businesses. 
            Energy-efficient solutions that save you money.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-8 py-6">
              <Phone className="w-5 h-5 mr-2" /> Schedule Service
            </Button>
            <Button variant="outline" className="border-slate-600 hover:bg-slate-800 px-8 py-6">
              Calculate Savings
            </Button>
          </div>
          
          <div className="flex gap-8 mt-12 pt-8 border-t border-slate-700">
            {[
              { value: '24/7', label: 'Emergency Service' },
              { value: 'A+', label: 'BBB Rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative min-h-[50vh] lg:min-h-full">
        <img src={hvacImg} alt="" className="w-full h-full object-cover" />
      </div>
    </section>

    {/* Services */}
    <section className="py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Our <span className="text-cyan-500">Services</span></h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '❄️', title: 'AC Installation', desc: 'New system installation' },
            { icon: '🔥', title: 'Heating Systems', desc: 'Furnace repair & install' },
            { icon: '🌬️', title: 'Air Quality', desc: 'Purifiers & ventilation' },
          ].map(service => (
            <div key={service.title} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
              <span className="text-5xl">{service.icon}</span>
              <h3 className="text-2xl font-bold mt-6 mb-3">{service.title}</h3>
              <p className="text-slate-500">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Climate Control HVAC" dark={false} />
  </div>
);

// ============ SOLAR - Bright Eco Style ============
const SolarDemo = () => (
  <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-slate-900">
    <DemoBanner color="bg-amber-500" />
    
    {/* Hero - Sunny bright */}
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={solarImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-amber-50/80 to-transparent" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-5 py-2 mb-6">
            <Sun className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-medium">Harness the Power of the Sun</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-slate-900">
            SunPower<br />
            <span className="text-amber-500">Solar</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10">
            Go solar and start saving from day one. Clean energy for a 
            brighter future, with $0 down financing available.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-6 shadow-lg">
              <Calculator className="w-5 h-5 mr-2" /> Calculate Savings
            </Button>
            <Button variant="outline" className="border-slate-300 hover:bg-slate-100 px-8 py-6">
              Learn More
            </Button>
          </div>
          
          {/* Impact stats */}
          <div className="grid grid-cols-3 gap-6 bg-white rounded-2xl p-6 shadow-lg">
            {[
              { value: '5M+', label: 'kW Installed', icon: Sun },
              { value: '10K+', label: 'Happy Homes', icon: Home },
              { value: '50K', label: 'Tons CO2 Saved', icon: Leaf },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Why Go <span className="text-amber-500">Solar</span>?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { title: 'Save Money', desc: 'Reduce energy bills by up to 90%' },
            { title: '25-Year Warranty', desc: 'Long-term protection guaranteed' },
            { title: 'Tax Credits', desc: 'Federal & state incentives available' },
            { title: 'Eco Friendly', desc: 'Reduce your carbon footprint' },
          ].map(item => (
            <div key={item.title} className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sun className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="SunPower Solar" dark={false} />
  </div>
);

// ============ POOL - Resort Paradise Style ============
const PoolDemo = () => (
  <div className="min-h-screen bg-slate-900 text-white">
    <DemoBanner color="bg-teal-400 text-slate-900" />
    
    {/* Hero - Luxury resort */}
    <section className="relative min-h-screen">
      <div className="absolute inset-0">
        <img src={poolImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-end pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-6">
            <Waves className="w-6 h-6 text-teal-400" />
            <span className="text-teal-400 uppercase tracking-[0.2em] text-sm font-medium">Luxury Pool Construction</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            Paradise<br />
            <span className="text-teal-400">Pools</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-xl">
            Your backyard paradise awaits. Custom luxury pools, spas, and outdoor 
            living spaces designed for the ultimate home experience.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-teal-400 hover:bg-teal-300 text-slate-900 font-bold px-10 py-6 text-lg">
              Design Your Pool
            </Button>
            <Button variant="outline" className="border-white/30 hover:bg-white/10 px-10 py-6 text-lg">
              <Play className="w-5 h-5 mr-2" /> Watch Video
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Pool types */}
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Pool <span className="text-teal-400">Designs</span></h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Infinity Pools', desc: 'Stunning vanishing edge designs' },
            { title: 'Natural Pools', desc: 'Organic, eco-friendly swimming' },
            { title: 'Resort Style', desc: 'Bring the vacation home' },
          ].map(pool => (
            <div key={pool.title} className="group cursor-pointer">
              <div className="aspect-[4/3] bg-slate-800 rounded-2xl mb-4 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Waves className="w-16 h-16 text-teal-400/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-teal-400 transition-colors">{pool.title}</h3>
              <p className="text-slate-400">{pool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Paradise Pools" />
  </div>
);

// ============ GENERAL CONTRACTOR - Bold Construction Style ============
const GeneralDemo = () => (
  <div className="min-h-screen bg-neutral-900 text-white">
    <DemoBanner color="bg-orange-500" />
    
    {/* Hero - Bold diagonal */}
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={generalImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900/50" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
            HAMMER<br />
            <span className="text-orange-500">&</span> NAIL<br />
            <span className="text-neutral-500">CONSTRUCTION</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-10">
            Quality craftsmanship on every project. From renovations to custom builds, 
            we bring your vision to life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-6">
              <Phone className="w-5 h-5 mr-2" /> Start Your Project
            </Button>
            <Button variant="outline" className="border-neutral-600 hover:bg-neutral-800 px-8 py-6">
              View Portfolio
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Services */}
    <section className="py-24 bg-neutral-950">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-black mb-12">WHAT WE <span className="text-orange-500">BUILD</span></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Home Remodels', 'Room Additions', 'Kitchen & Bath', 'Custom Homes', 'Commercial Build-Outs', 'Outdoor Living'].map(service => (
            <div key={service} className="bg-neutral-800 p-8 rounded-lg hover:bg-neutral-700 transition-colors group">
              <Hammer className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">{service}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Hammer & Nail Construction" />
  </div>
);

// ============ PLUMBING - Clean Professional Style ============
const PlumbingDemo = () => (
  <div className="min-h-screen bg-white text-slate-900">
    <DemoBanner color="bg-blue-600" />
    
    {/* Hero - Trust focused */}
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src={plumbingImg} alt="" className="w-full h-full object-cover" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
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
            Available 24/7 for emergencies.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6">
              <Phone className="w-5 h-5 mr-2" /> Call Now
            </Button>
            <Button variant="outline" className="border-white/30 hover:bg-white/10 px-8 py-6">
              Book Online
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Services */}
    <section className="py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Our <span className="text-blue-600">Services</span></h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {['Drain Cleaning', 'Water Heaters', 'Leak Detection', 'Pipe Repair', 'Sewer Lines'].map(service => (
            <div key={service} className="bg-slate-50 rounded-xl p-6 text-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all">
              <Droplets className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold">{service}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>

    <DemoFooter name="Crystal Clear Plumbing" dark={false} />
  </div>
);

// ============ ROOFING - Strong Protective Style ============
const RoofingDemo = () => (
  <div className="min-h-screen bg-slate-900 text-white">
    <DemoBanner color="bg-slate-700" />
    
    {/* Hero - Protective shield */}
    <section className="relative min-h-screen">
      <div className="absolute inset-0">
        <img src={roofingImg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
      </div>
      
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center justify-center text-center">
        <div className="max-w-3xl">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Apex Roofing<br />
            <span className="text-slate-400">Solutions</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Protecting homes from the top down. Expert roofing services with 
            warranties you can trust.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 py-6">
              Free Inspection
            </Button>
            <Button variant="outline" className="border-slate-600 hover:bg-slate-800 px-8 py-6">
              Storm Damage?
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {['Free Inspections', '25-Year Warranty', 'Insurance Help', 'Financing'].map(feature => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
                <span className="text-slate-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <DemoFooter name="Apex Roofing Solutions" />
  </div>
);

// ============ SHARED COMPONENTS ============
const DemoBanner = ({ color }: { color: string }) => (
  <>
    <div className="fixed top-4 left-4 z-50">
      <Link to="/#portfolio">
        <Button variant="outline" className="bg-black/50 border-white/20 text-white hover:bg-black/70 backdrop-blur group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </Link>
    </div>
    <div className={`${color} text-center py-2 text-sm font-medium`}>
      🎨 Demo Preview • <Link to="/#contact" className="underline font-bold hover:no-underline">Get this for your business →</Link>
    </div>
  </>
);

const DemoFooter = ({ name, dark = true }: { name: string; dark?: boolean }) => (
  <>
    <section className={`py-16 ${dark ? 'bg-primary text-primary-foreground' : 'bg-slate-900 text-white'}`}>
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Want a Website Like This?</h2>
        <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
          Hardhat Hosting can build you a professional website just like this one.
        </p>
        <Link to="/#contact">
          <Button size="lg" className={dark ? 'bg-white text-primary hover:bg-slate-100' : 'bg-white text-slate-900 hover:bg-slate-100'}>
            Get This Website
          </Button>
        </Link>
      </div>
    </section>
    <footer className={`py-8 border-t ${dark ? 'bg-card border-border/30' : 'bg-slate-100 border-slate-200'}`}>
      <div className="container mx-auto px-6 text-center">
        <p className={dark ? 'text-muted-foreground' : 'text-slate-500'}>Demo by Hardhat Hosting</p>
        <Link to="/" className="text-primary hover:underline font-medium">hardhathosting.com</Link>
      </div>
    </footer>
  </>
);

// ============ MAIN COMPONENT ============
const DemoSite = () => {
  const { trade } = useParams<{ trade: string }>();
  useScrollToTop();

  const demoComponents: Record<string, React.FC> = {
    concrete: ConcreteDemo,
    electrical: ElectricalDemo,
    architecture: ArchitectureDemo,
    engineering: EngineeringDemo,
    interior: InteriorDemo,
    landscaping: LandscapingDemo,
    hvac: HVACDemo,
    solar: SolarDemo,
    pool: PoolDemo,
    general: GeneralDemo,
    plumbing: PlumbingDemo,
    roofing: RoofingDemo,
  };

  const DemoComponent = trade ? demoComponents[trade] : null;

  if (!DemoComponent) {
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

  return <DemoComponent />;
};

export default DemoSite;
