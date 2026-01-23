import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, StatCounter, ContactForm, FAQItem, ProcessStep } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Waves, Phone, Star, ChevronRight, Play, CheckCircle2, Sparkles, Sun, Umbrella, Palmtree } from 'lucide-react';
import poolImg from '@/assets/demo-pool.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Pools', id: 'pools' },
  { name: 'Gallery', id: 'gallery' },
  { name: 'Process', id: 'process' },
  { name: 'Contact', id: 'contact' },
];

const PoolDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
          <Waves className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <Sun className="w-2.5 h-2.5 text-yellow-800" />
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-white">Paradise</span>
        <span className="text-2xl font-light text-teal-400"> Pools</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <DemoBanner color="bg-gradient-to-r from-teal-500 to-blue-500" textColor="text-white" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-teal-500" theme="dark" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Resort Paradise Style */}
          <section className="relative min-h-[90vh]">
            <div className="absolute inset-0">
              <img src={poolImg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/20" />
            </div>
            
            <div className="relative container mx-auto px-6 py-32 min-h-[90vh] flex items-end pb-24">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-6 py-2 mb-8">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/90 font-medium">Southern California's Premier Pool Builder</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-none">
                  Your<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">Paradise</span><br />
                  Awaits
                </h1>
                <p className="text-xl text-slate-300 mb-10 max-w-xl">
                  Custom luxury pools, spas, and outdoor living spaces designed for 
                  the ultimate backyard experience.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-bold px-10 py-6 text-lg shadow-lg shadow-teal-500/25">
                    Design Your Pool
                  </Button>
                  <Button variant="outline" className="border-white/30 hover:bg-white/10 px-10 py-6 text-lg group">
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Watch Video
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Trust indicators */}
          <section className="py-16 bg-slate-950 border-y border-slate-800">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatCounter value="500+" label="Pools Built" icon={<Waves className="w-6 h-6 text-teal-400" />} theme="dark" />
                <StatCounter value="25" label="Years Experience" icon={<Star className="w-6 h-6 text-yellow-400" />} theme="dark" />
                <StatCounter value="5★" label="Google Rating" icon={<Star className="w-6 h-6 text-yellow-400" />} theme="dark" />
                <StatCounter value="100%" label="Satisfaction" icon={<CheckCircle2 className="w-6 h-6 text-green-400" />} theme="dark" />
              </div>
            </div>
          </section>
          
          {/* Pool Types Preview */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-teal-400 uppercase tracking-widest text-sm font-medium">What We Build</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2">Pool Designs</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: 'Infinity Pools', desc: 'Stunning vanishing edge designs that blend seamlessly with the horizon.', icon: <Waves /> },
                  { title: 'Resort Style', desc: 'Bring the luxury vacation experience to your own backyard.', icon: <Palmtree /> },
                  { title: 'Family Pools', desc: 'Fun, safe, and designed for making memories together.', icon: <Umbrella /> },
                ].map((pool, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl cursor-pointer">
                    <div className="aspect-[4/3] bg-gradient-to-br from-teal-900 to-blue-900">
                      <img src={poolImg} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-4 text-white">
                        {pool.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{pool.title}</h3>
                      <p className="text-white/70 mb-4">{pool.desc}</p>
                      <div className="flex items-center gap-2 text-teal-400 font-medium">
                        <span>Learn More</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold">Happy <span className="text-teal-400">Homeowners</span></h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Paradise Pools turned our backyard into an absolute dream. We use it every single day!", author: "Jennifer & Mike", role: "Newport Beach" },
                  { quote: "From design to completion, the process was smooth and the result exceeded our expectations.", author: "The Garcia Family", role: "Irvine" },
                  { quote: "Best investment we ever made. Our pool has become the heart of our home.", author: "Tom Richards", role: "Laguna Beach" },
                ].map((t, i) => (
                  <TestimonialCard key={i} {...t} theme="dark" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* POOLS PAGE */}
      {activePage === 'pools' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Pool <span className="text-teal-400">Designs</span></h1>
              <p className="text-slate-400 max-w-2xl mx-auto">Every pool is custom designed to fit your lifestyle, space, and dreams.</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              {[
                { title: 'Infinity Edge Pools', desc: 'The ultimate in luxury. Our infinity pools create a stunning visual effect where the water appears to extend to the horizon.', features: ['Custom edge design', 'Ocean/city views integration', 'Catch basin engineering', 'LED lighting options'] },
                { title: 'Natural Lagoon Pools', desc: 'Organic shapes and natural materials create a tropical paradise feel with rock waterfalls and lush landscaping.', features: ['Natural stone finish', 'Built-in waterfalls', 'Beach entry options', 'Tropical landscaping'] },
                { title: 'Modern Geometric Pools', desc: 'Clean lines and contemporary design for the modern home. Perfect for architectural properties.', features: ['Precise geometry', 'Glass tile finishes', 'Integrated spa', 'Fire features'] },
                { title: 'Family Recreation Pools', desc: 'Designed for fun with built-in features for all ages. Shallow play areas, slides, and more.', features: ['Shallow sun shelf', 'Water features', 'Safe play areas', 'Basketball/volleyball'] },
              ].map((pool, i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700">
                  <div className="aspect-[16/9] bg-gradient-to-br from-teal-900 to-blue-900">
                    <img src={poolImg} alt="" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-3">{pool.title}</h3>
                    <p className="text-slate-400 mb-6">{pool.desc}</p>
                    <ul className="grid grid-cols-2 gap-3">
                      {pool.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add-ons */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Pool <span className="text-teal-400">Enhancements</span></h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {['Spas & Hot Tubs', 'Water Features', 'Outdoor Kitchens', 'Fire Pits', 'Pool Lighting', 'Cabanas', 'Automation', 'Landscaping'].map((item, i) => (
                <div key={i} className="bg-slate-800/50 p-6 rounded-xl text-center hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-teal-500/50">
                  <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-3" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* GALLERY PAGE */}
      {activePage === 'gallery' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Project <span className="text-teal-400">Gallery</span></h1>
              <p className="text-slate-400">A showcase of our finest work across Southern California.</p>
            </div>
            
            <div className="flex justify-center gap-4 mb-12">
              {['All', 'Infinity', 'Resort', 'Modern', 'Natural'].map((filter) => (
                <button key={filter} className="px-5 py-2 rounded-full text-sm font-medium border border-slate-700 hover:bg-teal-500 hover:border-teal-500 transition-colors">
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer">
                  <img src={poolImg} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-teal-400 text-sm mb-1">Infinity Pool</p>
                      <p className="text-white font-bold">Newport Beach Residence</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* PROCESS PAGE */}
      {activePage === 'process' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4">Our <span className="text-teal-400">Process</span></h1>
              <p className="text-slate-400 max-w-2xl mx-auto">From concept to completion, we guide you through every step of creating your dream pool.</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-12 mb-24">
              <ProcessStep number="01" title="Initial Consultation" description="We visit your property to discuss your vision, assess the space, and understand your lifestyle needs." theme="dark" accentColor="text-teal-400" />
              <ProcessStep number="02" title="Custom Design" description="Our designers create detailed 3D renderings so you can visualize your pool before construction begins." theme="dark" accentColor="text-teal-400" />
              <ProcessStep number="03" title="Permits & Planning" description="We handle all permits and work with local authorities to ensure your project is fully compliant." theme="dark" accentColor="text-teal-400" />
              <ProcessStep number="04" title="Construction" description="Our skilled craftsmen bring your design to life with attention to every detail." theme="dark" accentColor="text-teal-400" />
              <ProcessStep number="05" title="Finishing Touches" description="Tile work, decking, landscaping, and all the finishing elements that make your pool perfect." theme="dark" accentColor="text-teal-400" />
              <ProcessStep number="06" title="Final Walkthrough" description="We show you everything about your new pool and ensure you're completely satisfied." theme="dark" accentColor="text-teal-400" />
            </div>
            
            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked <span className="text-teal-400">Questions</span></h2>
              {[
                { q: 'How long does pool construction take?', a: 'Most pools take 8-12 weeks from groundbreaking to completion, depending on complexity and permits.' },
                { q: 'Do you offer financing?', a: 'Yes! We partner with several lenders to offer flexible financing options with competitive rates.' },
                { q: 'What about maintenance?', a: 'We offer ongoing maintenance packages, and all our pools come with full training on care and upkeep.' },
                { q: 'Do you work year-round?', a: 'Yes, we build pools throughout the year. Starting in off-season can often mean faster completion.' },
              ].map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} theme="dark" />
              ))}
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
                <h1 className="text-5xl font-bold mb-6">Start Your <span className="text-teal-400">Project</span></h1>
                <p className="text-slate-400 mb-12">
                  Ready to transform your backyard? Schedule a free consultation and 
                  let's start designing your dream pool.
                </p>
                
                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-xl border border-teal-500/20">
                    <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Call Us</p>
                      <p className="text-xl font-bold">(949) 555-POOL</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-8">
                  <h3 className="font-bold mb-4">What happens next?</h3>
                  <ol className="space-y-3 text-slate-400">
                    <li className="flex gap-3"><span className="text-teal-400 font-bold">1.</span> We'll contact you within 24 hours</li>
                    <li className="flex gap-3"><span className="text-teal-400 font-bold">2.</span> Schedule a free on-site consultation</li>
                    <li className="flex gap-3"><span className="text-teal-400 font-bold">3.</span> Receive a custom design proposal</li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-8">Request Free Consultation</h2>
                <ContactForm theme="dark" accentColor="bg-gradient-to-r from-teal-500 to-blue-500" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="Paradise Pools" 
        theme="dark" 
        accentColor="bg-gradient-to-r from-teal-500 to-blue-500" 
        phone="(949) 555-POOL"
        email="hello@paradisepools.com"
        address="Orange County, CA"
        services={['Infinity Pools', 'Resort Pools', 'Spas', 'Water Features', 'Outdoor Kitchens', 'Landscaping']}
      />
    </div>
  );
};

export default PoolDemo;
