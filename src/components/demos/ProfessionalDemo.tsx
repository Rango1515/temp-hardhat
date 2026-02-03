import { DemoBanner, DemoFooter } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Phone, Scale, Building, Users, Award, ArrowRight, Quote } from 'lucide-react';
import professionalImg from '@/assets/demo-professional.jpg';

const practiceAreas = [
  { name: "Corporate Law", description: "Business formation, mergers, and compliance" },
  { name: "Real Estate", description: "Commercial transactions and property disputes" },
  { name: "Employment", description: "Workplace policies and litigation defense" },
  { name: "Tax Planning", description: "Strategic tax optimization and compliance" },
];

const testimonials = [
  { name: "Robert Chen", role: "CEO, TechStart Inc.", quote: "Sterling Associates handled our Series B with exceptional expertise." },
  { name: "Sarah Williams", role: "Real Estate Developer", quote: "Their attention to detail saved us millions in potential liability." },
];

const ProfessionalDemo = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DemoBanner color="bg-amber-600" textColor="text-white" />
      
      {/* Navigation */}
      <nav className="bg-slate-900 text-white sticky top-8 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            <span className="font-serif text-xl tracking-wide">Sterling Associates</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#" className="hover:text-amber-500 transition-colors">Practice Areas</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Our Team</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Resources</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Contact</a>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-500 text-white">
            <Phone className="w-4 h-4 mr-2" /> Consultation
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] overflow-hidden">
        <img src={professionalImg} alt="Professional team" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/50" />
        <div className="relative container mx-auto px-6 py-32 flex items-center min-h-[80vh]">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-12 h-px bg-amber-500" />
              <span className="text-amber-500 uppercase tracking-widest text-sm">Trusted Legal Partners</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl mb-6 leading-tight">Excellence in Every Detail</h1>
            <p className="text-slate-300 text-xl mb-8 max-w-xl">For over 25 years, we've provided exceptional legal counsel to businesses and individuals throughout California.</p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-6 text-lg">
                Schedule Consultation <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Our Practice Areas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-slate-900 text-white py-8 border-b border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-serif text-amber-500 mb-1">25+</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-serif text-amber-500 mb-1">500+</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Cases Won</div>
            </div>
            <div>
              <div className="text-4xl font-serif text-amber-500 mb-1">50+</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Legal Experts</div>
            </div>
            <div>
              <div className="text-4xl font-serif text-amber-500 mb-1">98%</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-amber-600 uppercase tracking-widest text-sm">What We Do</span>
            <h2 className="font-serif text-4xl mt-2">Practice Areas</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {practiceAreas.map((area) => (
              <div key={area.name} className="bg-white p-8 border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer">
                <Building className="w-10 h-10 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl mb-2">{area.name}</h3>
                <p className="text-slate-600 text-sm">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-amber-500 uppercase tracking-widest text-sm">Client Success</span>
            <h2 className="font-serif text-4xl mt-2">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-800 p-8 border-l-4 border-amber-500">
                <Quote className="w-8 h-8 text-amber-500 mb-4" />
                <p className="text-lg mb-6 italic">"{t.quote}"</p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-slate-400 text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <Award className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="font-serif text-4xl mb-4">Ready to Discuss Your Case?</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">Schedule a confidential consultation with one of our experienced attorneys.</p>
          <Button className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-6 text-lg">
            <Phone className="w-5 h-5 mr-2" /> Book Your Consultation
          </Button>
        </div>
      </section>

      <DemoFooter name="Sterling Associates" theme="dark" accentColor="bg-amber-600" />
    </div>
  );
};

export default ProfessionalDemo;
