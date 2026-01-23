import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, StatCounter, ContactForm, ServiceCard, FAQItem } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Hammer, Phone, CheckCircle2, Star, Shield, Clock, Users, ArrowRight, Home, Wrench, Ruler, Building } from 'lucide-react';
import concreteImg from '@/assets/demo-concrete.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'Services', id: 'services' },
  { name: 'Projects', id: 'projects' },
  { name: 'About', id: 'about' },
  { name: 'Contact', id: 'contact' },
];

const ConcreteDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-amber-500 flex items-center justify-center">
        <Hammer className="w-7 h-7 text-zinc-900" />
      </div>
      <div>
        <span className="text-xl font-black text-white tracking-tight">SOLID</span>
        <span className="text-xl font-light text-amber-500"> FOUNDATION</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <DemoBanner color="bg-amber-500" textColor="text-zinc-900" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-amber-500" theme="dark" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero - Industrial Bold Style */}
          <section className="relative min-h-[90vh]">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
              <div className="absolute right-0 top-0 w-2/3 h-full">
                <img src={concreteImg} alt="" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-amber-500/10 to-transparent" />
            </div>
            
            <div className="relative container mx-auto px-6 py-32 min-h-[90vh] flex items-center">
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
                  Industrial-strength concrete solutions for residential and commercial projects. 
                  Built to last. Guaranteed.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-8 py-6 text-lg">
                    <Phone className="w-5 h-5 mr-2" /> Get Quote
                  </Button>
                  <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-8 py-6 text-lg" onClick={() => setActivePage('projects')}>
                    View Projects
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Stats bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-800/90 backdrop-blur border-t border-zinc-700">
              <div className="container mx-auto px-6 py-6 flex flex-wrap justify-between gap-8">
                <StatCounter value="25+" label="Years Experience" theme="dark" />
                <StatCounter value="2,000+" label="Projects Completed" theme="dark" />
                <StatCounter value="100%" label="Satisfaction Rate" theme="dark" />
                <StatCounter value="24/7" label="Support" theme="dark" />
              </div>
            </div>
          </section>
          
          {/* Services Preview */}
          <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-4 mb-12">
                <Hammer className="w-10 h-10 text-amber-500" />
                <h2 className="text-4xl font-black">WHAT WE BUILD</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
                {['Driveways & Patios', 'Foundations', 'Stamped Concrete', 'Concrete Repair', 'Commercial Flatwork', 'Retaining Walls'].map((service, i) => (
                  <div key={service} className="bg-zinc-900 p-8 hover:bg-zinc-800 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-amber-500">
                    <span className="text-amber-500/40 text-6xl font-black">0{i + 1}</span>
                    <h3 className="text-2xl font-bold mt-4 group-hover:text-amber-500 transition-colors">{service}</h3>
                    <p className="text-zinc-500 mt-2">Professional {service.toLowerCase()} built to last.</p>
                    <ArrowRight className="w-5 h-5 mt-4 text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Why Choose Us */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl font-black mb-8">WHY CHOOSE <span className="text-amber-500">US</span>?</h2>
                  <div className="space-y-6">
                    {[
                      { icon: <Shield className="w-6 h-6" />, title: 'Licensed & Insured', desc: 'Fully licensed, bonded, and insured for your protection.' },
                      { icon: <Star className="w-6 h-6" />, title: 'Quality Materials', desc: 'We use only premium grade concrete and reinforcement.' },
                      { icon: <Clock className="w-6 h-6" />, title: 'On-Time Delivery', desc: 'We complete projects on schedule, every time.' },
                      { icon: <Users className="w-6 h-6" />, title: 'Expert Team', desc: '25+ years of combined experience in our crew.' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-12 h-12 bg-amber-500 flex items-center justify-center flex-shrink-0 text-zinc-900">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <p className="text-zinc-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <img src={concreteImg} alt="" className="w-full aspect-square object-cover" />
                </div>
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-black mb-12 text-center">WHAT CLIENTS <span className="text-amber-500">SAY</span></h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { quote: "Best concrete work in the IE. They did our entire driveway and patio. Looks incredible!", author: "Mike R.", role: "Rancho Cucamonga" },
                  { quote: "Professional, on time, and quality work. The foundation for our addition was perfect.", author: "Sarah T.", role: "Ontario" },
                  { quote: "Highly recommend! Great communication and the stamped concrete exceeded expectations.", author: "David L.", role: "Fontana" },
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
              <h1 className="text-5xl font-black mb-4">OUR <span className="text-amber-500">SERVICES</span></h1>
              <p className="text-zinc-400 max-w-2xl mx-auto">From residential driveways to commercial foundations, we do it all.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Home className="w-8 h-8 text-zinc-900" />, title: 'Driveways', desc: 'Custom driveways that add curb appeal and last for decades.' },
                { icon: <Building className="w-8 h-8 text-zinc-900" />, title: 'Foundations', desc: 'Solid foundations for new construction and additions.' },
                { icon: <Ruler className="w-8 h-8 text-zinc-900" />, title: 'Patios & Walkways', desc: 'Beautiful outdoor living spaces that extend your home.' },
                { icon: <Wrench className="w-8 h-8 text-zinc-900" />, title: 'Repairs', desc: 'Expert repair and restoration of existing concrete.' },
                { icon: <Star className="w-8 h-8 text-zinc-900" />, title: 'Stamped Concrete', desc: 'Decorative finishes that mimic stone, brick, or tile.' },
                { icon: <Shield className="w-8 h-8 text-zinc-900" />, title: 'Retaining Walls', desc: 'Structural walls for erosion control and landscaping.' },
              ].map((s, i) => (
                <ServiceCard key={i} icon={s.icon} title={s.title} description={s.desc} theme="dark" accentColor="bg-amber-500" />
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-8 py-6" onClick={() => setActivePage('contact')}>
                Get Free Estimate
              </Button>
            </div>
          </div>
        </section>
      )}
      
      {/* PROJECTS PAGE */}
      {activePage === 'projects' && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-black mb-4">OUR <span className="text-amber-500">WORK</span></h1>
              <p className="text-zinc-400">A showcase of our recent concrete projects.</p>
            </div>
            
            <div className="flex justify-center gap-4 mb-12">
              {['All', 'Driveways', 'Foundations', 'Patios', 'Stamped'].map((filter) => (
                <button key={filter} className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-zinc-700 hover:bg-amber-500 hover:text-zinc-900 hover:border-amber-500 transition-colors">
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden cursor-pointer">
                  <img src={concreteImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-amber-500 text-sm uppercase tracking-wider mb-1">Driveway</p>
                      <p className="text-white font-bold text-lg">Residential Project #{i + 1}</p>
                    </div>
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
                <h1 className="text-5xl font-black mb-6">ABOUT <span className="text-amber-500">US</span></h1>
                <p className="text-zinc-400 text-lg mb-6">
                  Since 1995, Solid Foundation Concrete has been the Inland Empire's trusted 
                  concrete contractor. We've built our reputation on quality craftsmanship, 
                  honest pricing, and reliable service.
                </p>
                <p className="text-zinc-400 mb-8">
                  Our team of experienced professionals takes pride in every pour. From simple 
                  repairs to complex commercial projects, we treat every job with the same 
                  attention to detail.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-zinc-800 p-6">
                    <p className="text-4xl font-black text-amber-500">25+</p>
                    <p className="text-zinc-400">Years in Business</p>
                  </div>
                  <div className="bg-zinc-800 p-6">
                    <p className="text-4xl font-black text-amber-500">2,000+</p>
                    <p className="text-zinc-400">Projects Completed</p>
                  </div>
                </div>
              </div>
              <div>
                <img src={concreteImg} alt="" className="w-full aspect-[4/3] object-cover" />
              </div>
            </div>
            
            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-black text-center mb-12">COMMON <span className="text-amber-500">QUESTIONS</span></h2>
              {[
                { q: 'How long does concrete take to cure?', a: 'Concrete reaches about 70% strength in 7 days and full strength in 28 days. We recommend staying off new concrete for at least 3-7 days.' },
                { q: 'Do you offer warranties?', a: 'Yes! All our work comes with a 5-year warranty on craftsmanship and materials.' },
                { q: 'What areas do you serve?', a: 'We serve the entire Inland Empire including Rancho Cucamonga, Ontario, Fontana, Upland, Claremont, and surrounding areas.' },
                { q: 'How do I get a quote?', a: 'Contact us for a free on-site estimate. We\'ll assess your project and provide a detailed written quote within 24-48 hours.' },
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
                <h1 className="text-5xl font-black mb-6">GET YOUR <span className="text-amber-500">FREE QUOTE</span></h1>
                <p className="text-zinc-400 mb-12">
                  Ready to start your project? Contact us for a free, no-obligation estimate. 
                  We'll visit your property and provide a detailed quote within 48 hours.
                </p>
                
                <div className="space-y-6 mb-12">
                  <div className="flex items-center gap-4 p-5 bg-zinc-800">
                    <div className="w-12 h-12 bg-amber-500 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-zinc-900" />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Call Us</p>
                      <p className="text-xl font-bold">(909) 555-POUR</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/30 p-6">
                  <h3 className="font-bold text-amber-500 mb-2">FREE ON-SITE ESTIMATES</h3>
                  <p className="text-zinc-400">We come to you! No obligation, no pressure. Just honest advice and fair pricing.</p>
                </div>
              </div>
              
              <div className="bg-zinc-800 p-8 md:p-12">
                <h2 className="text-2xl font-black mb-8">REQUEST A QUOTE</h2>
                <ContactForm theme="dark" accentColor="bg-amber-500" />
              </div>
            </div>
          </div>
        </section>
      )}
      
      <DemoFooter 
        name="Solid Foundation Concrete" 
        theme="dark" 
        accentColor="bg-amber-500" 
        phone="(909) 555-POUR"
        email="info@solidfoundationconcrete.com"
        address="Rancho Cucamonga, CA"
        services={['Driveways', 'Foundations', 'Patios', 'Stamped Concrete', 'Repairs', 'Retaining Walls']}
      />
    </div>
  );
};

export default ConcreteDemo;
