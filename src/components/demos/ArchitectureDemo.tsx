import { useState } from 'react';
import { DemoBanner, DemoNav, DemoFooter, TestimonialCard, ProjectCard, StatCounter, TeamMember, ContactForm, FAQItem } from './DemoShared';
import { Button } from '@/components/ui/button';
import { ArrowRight, Award, Building2, Compass, Layers, Lightbulb, Users, ChevronDown } from 'lucide-react';
import architectureImg from '@/assets/demo-architecture.jpg';

const pages = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Services', id: 'services' },
  { name: 'Portfolio', id: 'portfolio' },
  { name: 'Contact', id: 'contact' },
];

const projects = [
  { title: 'Skyline Tower', category: 'Commercial', image: architectureImg },
  { title: 'Coastal Retreat', category: 'Residential', image: architectureImg },
  { title: 'Urban Loft Complex', category: 'Mixed Use', image: architectureImg },
  { title: 'Zen Garden House', category: 'Residential', image: architectureImg },
  { title: 'Tech Campus HQ', category: 'Commercial', image: architectureImg },
  { title: 'Hillside Villa', category: 'Luxury', image: architectureImg },
];

const testimonials = [
  { quote: "Blueprint Architecture transformed our vision into a stunning reality. Their attention to detail is unmatched.", author: "Sarah Chen", role: "CEO, TechVentures" },
  { quote: "Working with this team was an absolute pleasure. They understood our brand and delivered beyond expectations.", author: "Marcus Williams", role: "Director, Coastal Developments" },
  { quote: "The most collaborative architects we've ever worked with. True partners in the creative process.", author: "Elena Rodriguez", role: "Founder, Urban Living Co" },
];

const ArchitectureDemo = () => {
  const [activePage, setActivePage] = useState('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-900" />
      </div>
      <div>
        <span className="font-light text-lg tracking-tight">BLUEPRINT</span>
        <span className="block text-xs tracking-[0.3em] text-slate-500">ARCHITECTURE</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <DemoBanner color="bg-slate-900" textColor="text-white" />
      <DemoNav logo={<Logo />} pages={pages} activePage={activePage} onPageChange={setActivePage} accentColor="bg-slate-900" theme="light" />
      
      {/* HOME PAGE */}
      {activePage === 'home' && (
        <>
          {/* Hero */}
          <section className="relative h-[90vh] overflow-hidden">
            <img src={architectureImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-2xl">
                  <span className="inline-block text-slate-400 tracking-[0.5em] uppercase text-sm mb-6">Award-Winning Design</span>
                  <h1 className="text-6xl md:text-8xl font-extralight leading-[0.9] mb-8">
                    Where<br />
                    <span className="font-serif italic">vision</span><br />
                    meets form
                  </h1>
                  <p className="text-xl text-slate-600 mb-10 max-w-lg">
                    Creating iconic spaces that inspire, endure, and define the landscape of tomorrow.
                  </p>
                  <div className="flex gap-4">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 rounded-none">
                      View Our Work <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="border-slate-900 text-slate-900 hover:bg-slate-100 px-8 py-6 rounded-none">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-6 h-6 text-slate-400" />
            </div>
          </section>
          
          {/* Featured Stats */}
          <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <StatCounter value="200+" label="Projects Completed" theme="light" />
                <StatCounter value="35" label="Design Awards" theme="light" />
                <StatCounter value="30+" label="Years Experience" theme="light" />
                <StatCounter value="50" label="Team Members" theme="light" />
              </div>
            </div>
          </section>
          
          {/* Intro Section */}
          <section className="py-32">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div>
                  <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">Our Philosophy</span>
                  <h2 className="text-5xl font-extralight mt-4 mb-8 leading-tight">
                    Architecture is the<br />
                    <span className="font-serif italic">thoughtful making</span><br />
                    of space
                  </h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    At Blueprint Architecture, we believe that every building tells a story. Our designs 
                    harmonize with their surroundings while pushing the boundaries of innovation and sustainability.
                  </p>
                  <Button variant="outline" className="border-slate-900 text-slate-900 hover:bg-slate-100 rounded-none px-8 py-4" onClick={() => setActivePage('about')}>
                    About Our Studio <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <div className="aspect-[4/5] bg-slate-100">
                    <img src={architectureImg} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-12 -left-12 w-2/3 aspect-square bg-slate-900 p-8 text-white">
                    <p className="text-4xl font-light">"</p>
                    <p className="text-lg font-light leading-relaxed">Form follows function - and function follows vision.</p>
                    <p className="mt-4 text-sm text-slate-400">— James Mitchell, Founder</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Featured Projects Preview */}
          <section className="py-24 bg-slate-900 text-white">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="text-slate-500 tracking-[0.3em] uppercase text-sm">Selected Work</span>
                  <h2 className="text-4xl font-light mt-2">Featured Projects</h2>
                </div>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 rounded-none" onClick={() => setActivePage('portfolio')}>
                  View All
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((p, i) => (
                  <ProjectCard key={i} {...p} theme="dark" />
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">Testimonials</span>
                <h2 className="text-4xl font-light mt-2">What Clients Say</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                  <TestimonialCard key={i} {...t} theme="light" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* ABOUT PAGE */}
      {activePage === 'about' && (
        <>
          <section className="py-32">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center mb-20">
                <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">Our Story</span>
                <h1 className="text-5xl md:text-7xl font-extralight mt-4 mb-8">About Blueprint</h1>
                <p className="text-xl text-slate-600">
                  Founded in 1993, Blueprint Architecture has grown from a small studio to an 
                  internationally recognized firm with projects across three continents.
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
                <img src={architectureImg} alt="" className="w-full aspect-[4/3] object-cover" />
                <div>
                  <h2 className="text-3xl font-light mb-6">Our Mission</h2>
                  <p className="text-lg text-slate-600 mb-6">
                    We create architecture that responds to its context, serves its purpose beautifully, 
                    and stands the test of time. Our designs emerge from deep collaboration with clients, 
                    engineers, and communities.
                  </p>
                  <p className="text-lg text-slate-600">
                    Sustainability isn't an afterthought—it's woven into every decision we make, from 
                    material selection to energy systems to landscape integration.
                  </p>
                </div>
              </div>
              
              <div className="text-center mb-16">
                <h2 className="text-3xl font-light mb-4">Leadership Team</h2>
                <p className="text-slate-600">Meet the visionaries behind our designs</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <TeamMember name="James Mitchell" role="Founding Principal" theme="light" />
                <TeamMember name="Sarah Chen" role="Design Director" theme="light" />
                <TeamMember name="Marcus Williams" role="Managing Partner" theme="light" />
                <TeamMember name="Elena Rodriguez" role="Sustainability Lead" theme="light" />
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* SERVICES PAGE */}
      {activePage === 'services' && (
        <>
          <section className="py-32">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center mb-20">
                <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">What We Do</span>
                <h1 className="text-5xl md:text-7xl font-extralight mt-4 mb-8">Our Services</h1>
                <p className="text-xl text-slate-600">
                  From concept to completion, we offer comprehensive architectural services 
                  tailored to bring your vision to life.
                </p>
              </div>
              
              <div className="space-y-0 border-t border-slate-200 mb-20">
                {[
                  { icon: <Building2 className="w-6 h-6" />, title: 'Architectural Design', desc: 'Complete design services from concept through construction documentation' },
                  { icon: <Compass className="w-6 h-6" />, title: 'Master Planning', desc: 'Large-scale urban and campus planning with a focus on community' },
                  { icon: <Layers className="w-6 h-6" />, title: 'Interior Architecture', desc: 'Seamless integration of interior spaces with overall building design' },
                  { icon: <Lightbulb className="w-6 h-6" />, title: 'Sustainable Design', desc: 'LEED-certified, net-zero, and regenerative design solutions' },
                  { icon: <Users className="w-6 h-6" />, title: 'Consultation', desc: 'Expert guidance on feasibility, programming, and project strategy' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-8 py-8 border-b border-slate-200 group hover:bg-slate-50 transition-colors px-6 -mx-6 cursor-pointer">
                    <span className="text-slate-300 text-2xl font-light w-12">0{i + 1}</span>
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium group-hover:translate-x-2 transition-transform">{s.title}</h3>
                      <p className="text-slate-500">{s.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="p-8 border border-slate-200">
                  <Award className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium mb-2">Award-Winning</h3>
                  <p className="text-slate-500">35+ national and international design awards</p>
                </div>
                <div className="p-8 border border-slate-200">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium mb-2">Full Service</h3>
                  <p className="text-slate-500">From feasibility studies to construction admin</p>
                </div>
                <div className="p-8 border border-slate-200">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium mb-2">Collaborative</h3>
                  <p className="text-slate-500">We partner with you throughout the process</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* PORTFOLIO PAGE */}
      {activePage === 'portfolio' && (
        <>
          <section className="py-32">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center mb-16">
                <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">Selected Work</span>
                <h1 className="text-5xl md:text-7xl font-extralight mt-4 mb-8">Portfolio</h1>
              </div>
              
              <div className="flex justify-center gap-4 mb-12">
                {['All', 'Residential', 'Commercial', 'Mixed Use', 'Luxury'].map((filter) => (
                  <button key={filter} className="px-4 py-2 text-sm border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors">
                    {filter}
                  </button>
                ))}
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p, i) => (
                  <ProjectCard key={i} {...p} theme="light" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      
      {/* CONTACT PAGE */}
      {activePage === 'contact' && (
        <>
          <section className="py-32">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-20">
                <div>
                  <span className="text-slate-400 tracking-[0.3em] uppercase text-sm">Get in Touch</span>
                  <h1 className="text-5xl font-extralight mt-4 mb-8">Let's Work Together</h1>
                  <p className="text-lg text-slate-600 mb-12">
                    Whether you're planning a new build, renovation, or just exploring possibilities, 
                    we'd love to hear about your project.
                  </p>
                  
                  <div className="space-y-6 mb-12">
                    <div>
                      <h3 className="font-medium mb-1">Los Angeles Studio</h3>
                      <p className="text-slate-500">1234 Design District, Suite 500<br />Los Angeles, CA 90012</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Contact</h3>
                      <p className="text-slate-500">(555) 123-4567<br />hello@blueprintarch.com</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Hours</h3>
                      <p className="text-slate-500">Monday - Friday: 9am - 6pm</p>
                    </div>
                  </div>
                  
                  {/* FAQ */}
                  <h3 className="font-medium mb-4">Frequently Asked Questions</h3>
                  {[
                    { q: 'How long does a typical project take?', a: 'Project timelines vary based on scope and complexity. A residential project typically takes 6-12 months from concept to completion, while larger commercial projects may take 18-36 months.' },
                    { q: 'What is your design process?', a: 'We follow a phased approach: Discovery, Schematic Design, Design Development, Construction Documents, and Construction Administration. Each phase involves close collaboration with you.' },
                    { q: 'Do you work on residential projects?', a: 'Absolutely! We design custom homes, renovations, and additions for discerning clients who value thoughtful, lasting design.' },
                  ].map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} theme="light" />
                  ))}
                </div>
                
                <div className="bg-slate-50 p-8 md:p-12">
                  <h2 className="text-2xl font-light mb-8">Send Us a Message</h2>
                  <ContactForm theme="light" accentColor="bg-slate-900" />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      
      <DemoFooter 
        name="Blueprint Architecture" 
        theme="light" 
        accentColor="bg-slate-900" 
        phone="(555) 123-4567"
        email="hello@blueprintarch.com"
        address="Los Angeles, CA"
        services={['Architectural Design', 'Master Planning', 'Interior Architecture', 'Sustainable Design', 'Consultation']}
      />
    </div>
  );
};

export default ArchitectureDemo;
