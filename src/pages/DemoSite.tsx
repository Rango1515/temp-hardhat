import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useScrollToTop } from '@/hooks/useSmoothScroll';
import { usePageTracker } from '@/hooks/usePageTracker';

// Import full multi-page demo components
import ArchitectureDemo from '@/components/demos/ArchitectureDemo';
import ElectricalDemo from '@/components/demos/ElectricalDemo';
import PoolDemo from '@/components/demos/PoolDemo';
import InteriorDemo from '@/components/demos/InteriorDemo';
import SolarDemo from '@/components/demos/SolarDemo';
import ConcreteDemo from '@/components/demos/ConcreteDemo';
import PlumbingDemo from '@/components/demos/PlumbingDemo';
import EcommerceDemo from '@/components/demos/EcommerceDemo';
import ProfessionalDemo from '@/components/demos/ProfessionalDemo';
import PortfolioDemo from '@/components/demos/PortfolioDemo';
import SalonDemo from '@/components/demos/SalonDemo';

// Placeholder components for demos not yet converted to multi-page
import { DemoBanner, DemoFooter } from '@/components/demos/DemoShared';
import { Phone, Leaf, Thermometer, Home, Shield, Hammer, CheckCircle2 } from 'lucide-react';
import engineeringImg from '@/assets/demo-engineering.jpg';
import landscapingImg from '@/assets/demo-landscaping.jpg';
import hvacImg from '@/assets/demo-hvac.jpg';
import generalImg from '@/assets/demo-general.jpg';
import roofingImg from '@/assets/demo-roofing.jpg';

// Simple placeholder demos for remaining industries
const EngineeringDemo = () => (
  <div className="min-h-screen bg-slate-900 text-white font-mono">
    <DemoBanner color="bg-teal-500" textColor="text-white" />
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
            PRECISION<br /><span className="text-teal-400">ENGINEERING</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl font-sans">
            Engineering excellence built on science, innovation, and 30+ years of experience.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-8 py-6">Request Proposal →</Button>
            <Button variant="outline" className="border-slate-600 hover:bg-slate-800 px-8 py-6">View Case Studies</Button>
          </div>
        </div>
      </div>
    </section>
    <DemoFooter name="Precision Engineering" theme="dark" accentColor="bg-teal-500" />
  </div>
);

const LandscapingDemo = () => (
  <div className="min-h-screen bg-stone-900 text-stone-100">
    <DemoBanner color="bg-emerald-600" textColor="text-white" />
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
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Green Valley<br /><span className="text-emerald-400">Landscaping</span></h1>
          <p className="text-xl text-stone-300 mb-10">Transform your outdoor space into a living masterpiece.</p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6">Free Design Consultation</Button>
            <Button variant="outline" className="border-stone-600 text-white hover:bg-stone-800 px-8 py-6">View Gallery</Button>
          </div>
        </div>
      </div>
    </section>
    <DemoFooter name="Green Valley Landscaping" theme="dark" accentColor="bg-emerald-600" />
  </div>
);

const HVACDemo = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <DemoBanner color="bg-cyan-500" textColor="text-white" />
    <section className="min-h-screen grid lg:grid-cols-2">
      <div className="bg-slate-900 text-white flex items-center p-12 lg:p-20">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Thermometer className="w-6 h-6 text-cyan-400" />
            <span className="text-cyan-400 uppercase tracking-wider text-sm">Climate Control</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">COMFORT IN<br /><span className="text-cyan-400">EVERY SEASON</span></h1>
          <p className="text-lg text-slate-400 mb-10">Professional HVAC services. Energy-efficient solutions that save you money.</p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-8 py-6"><Phone className="w-5 h-5 mr-2" /> Schedule Service</Button>
          </div>
        </div>
      </div>
      <div className="relative min-h-[50vh] lg:min-h-full">
        <img src={hvacImg} alt="" className="w-full h-full object-cover" />
      </div>
    </section>
    <DemoFooter name="Climate Control HVAC" theme="light" accentColor="bg-cyan-500" />
  </div>
);

const GeneralDemo = () => (
  <div className="min-h-screen bg-neutral-900 text-white">
    <DemoBanner color="bg-orange-500" textColor="text-white" />
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={generalImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900/50" />
      </div>
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">HAMMER<br /><span className="text-orange-500">&</span> NAIL<br /><span className="text-neutral-500">CONSTRUCTION</span></h1>
          <p className="text-xl text-neutral-400 mb-10">Quality craftsmanship on every project.</p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-6"><Phone className="w-5 h-5 mr-2" /> Start Your Project</Button>
          </div>
        </div>
      </div>
    </section>
    <DemoFooter name="Hammer & Nail Construction" theme="dark" accentColor="bg-orange-500" />
  </div>
);

const RoofingDemo = () => (
  <div className="min-h-screen bg-slate-900 text-white">
    <DemoBanner color="bg-slate-700" textColor="text-white" />
    <section className="relative min-h-screen">
      <div className="absolute inset-0">
        <img src={roofingImg} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
      </div>
      <div className="relative container mx-auto px-6 py-32 min-h-screen flex items-center justify-center text-center">
        <div className="max-w-3xl">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Apex Roofing<br /><span className="text-slate-400">Solutions</span></h1>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">Protecting homes from the top down. Expert roofing with warranties you can trust.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 py-6">Free Inspection</Button>
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
    <DemoFooter name="Apex Roofing Solutions" theme="dark" accentColor="bg-slate-700" />
  </div>
);

// Main Component
const DemoSite = () => {
  const { trade } = useParams<{ trade: string }>();
  useScrollToTop();
  usePageTracker();

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
    // New universal demos
    ecommerce: EcommerceDemo,
    professional: ProfessionalDemo,
    portfolio: PortfolioDemo,
    salon: SalonDemo,
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
