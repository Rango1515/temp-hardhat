import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, StatCounter, ContactForm, FAQItem, PricingCard } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Star, Heart, Image, Palette, Ruler, Home, Eye, ArrowRight } from 'lucide-react';
import interiorImg from '@/assets/demo-interior.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Services', id: 'services' },
  { name: 'Portfolio', id: 'portfolio' },
  { name: 'About', id: 'about' },
  { name: 'Contact', id: 'contact' },
];

const InteriorDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-2">
      <span className="text-3xl font-light tracking-tight text-stone-800">Studio</span>
      <span className="text-3xl font-serif italic text-rose-400">Luxe</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <DemoBanner color="bg-rose-400" textColor="text-white" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-rose-400" theme="light" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Split Magazine Style */}
          <section className="min-h-[90vh] grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 lg:p-16 xl:p-24 order-2 lg:order-1">
              <div>
                <span className="text-rose-400 uppercase tracking-[0.4em] text-xs font-medium mb-6 block">Interior Design Studio</span>
                <h1 className="text-5xl md:text-7xl font-light leading-[0.95] mb-8">
                  Creating<br />
                  <span className="font-serif italic text-stone-600">Beautiful</span><br />
                  Spaces
                </h1>
                <p className="text-lg text-stone-500 mb-10 max-w-md leading-relaxed">
                  We transform houses into homes with sophisticated design that reflects your unique personality and lifestyle.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-rose-400 hover:bg-rose-500 text-white px-8 py-6 rounded-none font-medium">
                    Book Consultation
                  </Button>
                  <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-100 px-8 py-6 rounded-none">
                    View Portfolio
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 min-h-[50vh] lg:min-h-full">
              <img src={interiorImg} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-8 lg:w-64 bg-white/90 backdrop-blur p-6">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-rose-400 text-rose-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-600 italic">"Absolutely stunning work. They transformed our home beyond our dreams."</p>
                <p className="text-xs text-stone-400 mt-2">— Sarah M., Beverly Hills</p>
              </div>
            </div>
          </section>
          
          {/* Stats */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatCounter value="200+" label="Projects Completed" theme="light" />
                <StatCounter value="15" label="Years Experience" theme="light" />
                <StatCounter value="12" label="Design Awards" theme="light" />
                <StatCounter value="100%" label="Client Satisfaction" theme="light" />
              </div>
            </div>
          </section>
          
          {/* Services Preview */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">What We Offer</span>
                <h2 className="text-4xl font-light mt-4">Our Services</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-px bg-stone-200">
                {[
                  { icon: <Home className="w-8 h-8" />, title: 'Full Home Design', desc: 'Complete interior design from concept to installation' },
                  { icon: <Palette className="w-8 h-8" />, title: 'Color Consultation', desc: 'Expert color palette development for your space' },
                  { icon: <Sparkles className="w-8 h-8" />, title: 'Styling & Staging', desc: 'Finishing touches that bring your space to life' },
                ].map((s, i) => (
                  <div key={i} className="bg-stone-50 p-12 text-center hover:bg-rose-50 transition-colors group cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center text-rose-300 group-hover:text-rose-400 transition-colors">
                      {s.icon}
                    </div>
                    <h3 className="text-xl mb-3">{s.title}</h3>
                    <p className="text-stone-500 text-sm">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Featured Work */}
          <section className="py-24 bg-stone-900 text-white">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Our Work</span>
                  <h2 className="text-4xl font-light mt-2">Featured Projects</h2>
                </div>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-stone-900 rounded-none hidden md:flex" onClick={() => setActivePage('portfolio')}>
                  View All
                </Button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: 'Modern Minimalist Loft', category: 'Residential' },
                  { title: 'Coastal Beach House', category: 'Vacation Home' },
                  { title: 'Luxury Penthouse', category: 'Residential' },
                ].map((p, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-[4/5] overflow-hidden mb-4">
                      <img src={interiorImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <p className="text-rose-400 text-xs uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-xl">{p.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-rose-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Testimonials</span>
                <h2 className="text-4xl font-light mt-4">Client Love</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Working with Studio Luxe was a dream. They understood our vision perfectly and exceeded every expectation.", author: "Jennifer Walsh", role: "Pacific Palisades" },
                  { quote: "Incredible attention to detail. Every piece they selected was absolutely perfect for our home.", author: "Michael & David", role: "West Hollywood" },
                  { quote: "They transformed our outdated space into a modern sanctuary. We couldn't be happier!", author: "Lisa Chen", role: "Brentwood" },
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
            <div className="text-center mb-20">
              <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Our Services</span>
              <h1 className="text-5xl font-light mt-4 mb-6">How We Help</h1>
              <p className="text-stone-500 max-w-2xl mx-auto">From complete home transformations to focused room makeovers, we offer design services tailored to your needs and budget.</p>
            </div>
            
            <div className="space-y-16">
              {[
                { icon: <Home className="w-8 h-8" />, title: 'Full Service Interior Design', desc: 'Complete end-to-end design service including space planning, material selection, furniture procurement, and installation oversight.', features: ['Initial consultation', 'Concept development', 'Detailed floor plans', 'Custom furniture', 'Project management', 'Installation'] },
                { icon: <Palette className="w-8 h-8" />, title: 'Room Refresh', desc: 'Perfect for updating a single room or area. We work with your existing pieces and add new elements to create a cohesive look.', features: ['Color palette', 'Furniture layout', 'Accessory selection', 'Art curation', 'Styling'] },
                { icon: <Eye className="w-8 h-8" />, title: 'E-Design', desc: 'Our virtual design service for clients outside our local area. Receive professional design plans delivered digitally.', features: ['Video consultation', 'Digital mood boards', 'Shopping lists', 'Room layouts', 'Email support'] },
                { icon: <Ruler className="w-8 h-8" />, title: 'New Construction', desc: 'We collaborate with architects and builders from the ground up, ensuring every finish and fixture is perfectly selected.', features: ['Material selection', 'Finish schedules', 'Lighting design', 'Custom millwork', 'Fixture selection'] },
              ].map((s, i) => (
                <div key={i} className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                      <img src={interiorImg} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center text-rose-400 mb-6">
                      {s.icon}
                    </div>
                    <h3 className="text-3xl font-light mb-4">{s.title}</h3>
                    <p className="text-stone-500 mb-6">{s.desc}</p>
                    <ul className="grid grid-cols-2 gap-3">
                      {s.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-stone-600">
                          <Heart className="w-3 h-3 text-rose-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pricing Preview */}
            <div className="mt-24 text-center">
              <h2 className="text-3xl font-light mb-8">Investment</h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <PricingCard title="Room Refresh" price="$2,500" period=" starting" features={['Single room', 'Design plan', 'Shopping list', '2 revisions']} theme="light" accentColor="bg-rose-400" />
                <PricingCard title="Full Service" price="$150" period="/sq ft" features={['Complete design', 'Procurement', 'Installation', 'Unlimited revisions', 'Project management']} isPopular theme="light" accentColor="bg-rose-400" />
                <PricingCard title="E-Design" price="$750" period="/room" features={['Virtual consult', 'Digital plans', 'Shopping guide', 'Email support']} theme="light" accentColor="bg-rose-400" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* PORTFOLIO PAGE */}
      {activePage === 'portfolio' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Our Work</span>
              <h1 className="text-5xl font-light mt-4">Portfolio</h1>
            </div>
            
            <div className="flex justify-center gap-4 mb-12">
              {['All', 'Residential', 'Commercial', 'Vacation'].map((filter) => (
                <button key={filter} className="px-4 py-2 text-sm border border-stone-200 hover:bg-rose-400 hover:text-white hover:border-rose-400 transition-colors rounded-none">
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Malibu Beach House', category: 'Residential', size: 'large' },
                { title: 'DTLA Loft', category: 'Residential', size: 'small' },
                { title: 'Boutique Hotel Lobby', category: 'Commercial', size: 'small' },
                { title: 'Mountain Retreat', category: 'Vacation', size: 'large' },
                { title: 'Modern Farmhouse', category: 'Residential', size: 'small' },
                { title: 'Executive Office', category: 'Commercial', size: 'small' },
              ].map((p, i) => (
                <div key={i} className={`group cursor-pointer ${p.size === 'large' ? 'md:col-span-1 md:row-span-2' : ''}`}>
                  <div className={`overflow-hidden ${p.size === 'large' ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
                    <img src={interiorImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="py-4">
                    <p className="text-rose-400 text-xs uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-xl group-hover:text-rose-400 transition-colors">{p.title}</h3>
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
                <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Our Story</span>
                <h1 className="text-5xl font-light mt-4 mb-8">About Studio Luxe</h1>
                <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                  Founded in 2009 by principal designer Amanda Luxe, Studio Luxe has grown into one of Southern California's most sought-after interior design firms.
                </p>
                <p className="text-stone-500 mb-8">
                  We believe that great design should be personal, functional, and beautiful. Every project we undertake is an opportunity to create spaces that not only look stunning but truly enhance the lives of those who inhabit them.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-2xl">A</div>
                  <div>
                    <p className="font-medium">Amanda Luxe</p>
                    <p className="text-sm text-stone-500">Founder & Principal Designer</p>
                  </div>
                </div>
              </div>
              <div>
                <img src={interiorImg} alt="" className="w-full aspect-[4/5] object-cover" />
              </div>
            </div>
            
            {/* Values */}
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {[
                { title: 'Personalized', desc: 'Every design is tailored specifically to you. No two projects are ever the same.' },
                { title: 'Quality', desc: 'We partner with the finest artisans and source only the highest quality materials.' },
                { title: 'Timeless', desc: 'We create spaces that transcend trends and remain beautiful for years to come.' },
              ].map((v, i) => (
                <div key={i}>
                  <h3 className="text-xl mb-3">{v.title}</h3>
                  <p className="text-stone-500">{v.desc}</p>
                </div>
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
                <span className="text-rose-400 uppercase tracking-[0.3em] text-xs font-medium">Get in Touch</span>
                <h1 className="text-5xl font-light mt-4 mb-8">Let's Create Together</h1>
                <p className="text-stone-500 mb-12">
                  Ready to transform your space? We'd love to hear about your project. 
                  Fill out the form and we'll be in touch within 24 hours.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-1">Studio</h3>
                    <p className="text-stone-500">8383 Wilshire Blvd, Suite 400<br />Beverly Hills, CA 90211</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Contact</h3>
                    <p className="text-stone-500">(310) 555-LUXE<br />hello@studioluxe.com</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Hours</h3>
                    <p className="text-stone-500">By appointment only</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 md:p-12 shadow-xl">
                <h2 className="text-2xl font-light mb-8">Start Your Project</h2>
                <ContactForm theme="light" accentColor="bg-rose-400" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="Studio Luxe Interiors" 
        theme="light" 
        accentColor="bg-rose-400" 
        phone="(310) 555-LUXE"
        email="hello@studioluxe.com"
        address="Beverly Hills, CA"
        services={['Full Service Design', 'Room Refresh', 'E-Design', 'Staging', 'Color Consultation']}
      />
    </div>
  );
};

export default InteriorDemo;
