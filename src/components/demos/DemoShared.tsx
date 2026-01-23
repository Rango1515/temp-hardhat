import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, Clock, ChevronRight, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useState, ReactNode } from 'react';

// Demo Navigation Component with internal page routing
interface DemoNavProps {
  logo: ReactNode;
  pages: { name: string; id: string }[];
  activePage: string;
  onPageChange: (id: string) => void;
  accentColor: string;
  theme?: 'light' | 'dark';
}

export const DemoNav = ({ logo, pages, activePage, onPageChange, accentColor, theme = 'dark' }: DemoNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';
  
  return (
    <nav className={`sticky top-8 z-40 border-b ${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10' : 'bg-white/90 backdrop-blur-xl border-black/5'}`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">{logo}</div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activePage === page.id 
                    ? `${accentColor} text-white` 
                    : isDark 
                      ? 'text-white/70 hover:text-white hover:bg-white/5' 
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="hidden md:block">
            <Button className={`${accentColor} text-white font-semibold`} onClick={() => onPageChange('contact')}>
              Get in Touch
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            <div className={`w-6 h-0.5 ${isDark ? 'bg-white' : 'bg-black'} transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-6 h-0.5 ${isDark ? 'bg-white' : 'bg-black'} my-1.5 transition-all ${isOpen ? 'opacity-0' : ''}`} />
            <div className={`w-6 h-0.5 ${isDark ? 'bg-white' : 'bg-black'} transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
        
        {/* Mobile menu */}
        {isOpen && (
          <div className={`md:hidden py-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => { onPageChange(page.id); setIsOpen(false); }}
                className={`block w-full text-left px-4 py-3 text-lg font-medium ${
                  activePage === page.id 
                    ? (isDark ? 'text-white' : 'text-black')
                    : (isDark ? 'text-white/60' : 'text-black/60')
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

// Demo Banner with back button
export const DemoBanner = ({ color, textColor = 'text-white' }: { color: string; textColor?: string }) => (
  <>
    <div className="fixed top-4 left-4 z-50">
      <Link to="/#portfolio">
        <Button variant="outline" className="bg-black/50 border-white/20 text-white hover:bg-black/70 backdrop-blur group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </Link>
    </div>
    <div className={`${color} ${textColor} text-center py-2 text-sm font-medium`}>
      🎨 Demo Preview • <Link to="/#contact" className="underline font-bold hover:no-underline">Get this for your business →</Link>
    </div>
  </>
);

// Full Demo Footer with social links
interface DemoFooterProps {
  name: string;
  theme?: 'light' | 'dark';
  accentColor: string;
  phone?: string;
  email?: string;
  address?: string;
  services?: string[];
}

export const DemoFooter = ({ name, theme = 'dark', accentColor, phone = '(555) 123-4567', email = 'info@example.com', address = 'Los Angeles, CA', services = [] }: DemoFooterProps) => {
  const isDark = theme === 'dark';
  
  return (
    <>
      {/* CTA Section */}
      <section className={`py-20 ${accentColor}`}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Want a Website Like This?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Hardhat Hosting can build you a professional website just like this one.
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8">
              Get This Website
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Main Footer */}
      <footer className={`py-16 ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* About */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold mb-4">{name}</h3>
              <p className={`${isDark ? 'text-zinc-400' : 'text-slate-600'} mb-6 max-w-md`}>
                Providing exceptional service and quality craftsmanship since 2005. 
                Licensed, bonded, and insured for your peace of mind.
              </p>
              <div className="flex gap-4">
                {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-200 hover:bg-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Services */}
            {services.length > 0 && (
              <div>
                <h4 className="font-bold mb-4">Services</h4>
                <ul className={`space-y-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {services.slice(0, 6).map(s => (
                    <li key={s} className="hover:text-white transition-colors cursor-pointer">{s}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className={`space-y-3 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" />{phone}</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" />{email}</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" />{address}</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4" />Mon-Fri 7am-6pm</li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Demo by Hardhat Hosting • <Link to="/" className="hover:underline">hardhathosting.com</Link>
            </p>
            <p className={`text-sm ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
              © {new Date().getFullYear()} {name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

// Testimonial Card Component
interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  rating?: number;
  theme?: 'light' | 'dark';
}

export const TestimonialCard = ({ quote, author, role, rating = 5, theme = 'dark' }: TestimonialProps) => {
  const isDark = theme === 'dark';
  return (
    <div className={`p-8 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl'}`}>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
      </div>
      <p className={`text-lg mb-6 ${isDark ? 'text-white/80' : 'text-slate-600'}`}>"{quote}"</p>
      <div>
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{author}</p>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{role}</p>
      </div>
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  image: string;
  title: string;
  category: string;
  theme?: 'light' | 'dark';
}

export const ProjectCard = ({ image, title, category, theme = 'dark' }: ProjectCardProps) => {
  const isDark = theme === 'dark';
  return (
    <div className="group relative overflow-hidden rounded-2xl cursor-pointer">
      <img src={image} alt={title} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white/60 text-sm mb-1">{category}</p>
          <h3 className="text-white text-xl font-bold">{title}</h3>
          <div className="flex items-center gap-2 mt-3 text-white/80">
            <span className="text-sm">View Project</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Counter Component
interface StatProps {
  value: string;
  label: string;
  icon?: ReactNode;
  theme?: 'light' | 'dark';
}

export const StatCounter = ({ value, label, icon, theme = 'dark' }: StatProps) => {
  const isDark = theme === 'dark';
  return (
    <div className="text-center">
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      <div className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      <div className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{label}</div>
    </div>
  );
};

// Service Card Component
interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  theme?: 'light' | 'dark';
  accentColor?: string;
}

export const ServiceCard = ({ icon, title, description, theme = 'dark', accentColor = 'bg-primary' }: ServiceCardProps) => {
  const isDark = theme === 'dark';
  return (
    <div className={`group p-8 rounded-2xl transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white shadow-lg hover:shadow-xl'}`}>
      <div className={`w-14 h-14 ${accentColor} rounded-xl flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`${isDark ? 'text-white/60' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
};

// Team Member Card
interface TeamMemberProps {
  name: string;
  role: string;
  image?: string;
  theme?: 'light' | 'dark';
}

export const TeamMember = ({ name, role, image, theme = 'dark' }: TeamMemberProps) => {
  const isDark = theme === 'dark';
  return (
    <div className="text-center group">
      <div className={`w-32 h-32 mx-auto rounded-full mb-4 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{name[0]}</div>
        )}
      </div>
      <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</h4>
      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{role}</p>
    </div>
  );
};

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  theme?: 'light' | 'dark';
}

export const FAQItem = ({ question, answer, isOpen, onToggle, theme = 'dark' }: FAQItemProps) => {
  const isDark = theme === 'dark';
  return (
    <div className={`border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
      <button 
        onClick={onToggle}
        className={`w-full py-6 flex items-center justify-between text-left ${isDark ? 'text-white' : 'text-slate-900'}`}
      >
        <span className="text-lg font-medium pr-4">{question}</span>
        <span className={`text-2xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
      </button>
      {isOpen && (
        <div className={`pb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {answer}
        </div>
      )}
    </div>
  );
};

// Contact Form Component
interface ContactFormProps {
  theme?: 'light' | 'dark';
  accentColor?: string;
}

export const ContactForm = ({ theme = 'dark', accentColor = 'bg-primary' }: ContactFormProps) => {
  const isDark = theme === 'dark';
  const inputClass = `w-full px-4 py-3 rounded-lg transition-all outline-none ${
    isDark 
      ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30' 
      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:shadow-lg'
  }`;
  
  return (
    <form className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" className={inputClass} />
        <input type="text" placeholder="Last Name" className={inputClass} />
      </div>
      <input type="email" placeholder="Email Address" className={inputClass} />
      <input type="tel" placeholder="Phone Number" className={inputClass} />
      <select className={inputClass}>
        <option value="">Select a Service</option>
        <option value="consultation">Free Consultation</option>
        <option value="quote">Request Quote</option>
        <option value="support">Support</option>
      </select>
      <textarea placeholder="Tell us about your project..." rows={4} className={inputClass} />
      <Button className={`w-full ${accentColor} text-white font-bold py-6`}>
        Send Message
      </Button>
    </form>
  );
};

// Pricing Card Component
interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  isPopular?: boolean;
  theme?: 'light' | 'dark';
  accentColor?: string;
}

export const PricingCard = ({ title, price, period = '/project', features, isPopular = false, theme = 'dark', accentColor = 'bg-primary' }: PricingCardProps) => {
  const isDark = theme === 'dark';
  return (
    <div className={`relative p-8 rounded-2xl ${isPopular ? accentColor : isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-1 rounded-full">
          MOST POPULAR
        </div>
      )}
      <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${isPopular ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{price}</span>
        <span className={`${isPopular ? 'text-white/70' : isDark ? 'text-white/50' : 'text-slate-500'}`}>{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className={`flex items-center gap-2 ${isPopular ? 'text-white/90' : isDark ? 'text-white/70' : 'text-slate-600'}`}>
            <span className={isPopular ? 'text-white' : 'text-green-500'}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Button className={`w-full ${isPopular ? 'bg-white text-black hover:bg-white/90' : `${accentColor} text-white`}`}>
        Get Started
      </Button>
    </div>
  );
};

// Process Step Component
interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  theme?: 'light' | 'dark';
  accentColor?: string;
}

export const ProcessStep = ({ number, title, description, theme = 'dark', accentColor = 'text-primary' }: ProcessStepProps) => {
  const isDark = theme === 'dark';
  return (
    <div className="relative pl-16">
      <div className={`absolute left-0 top-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isDark ? 'bg-white/10' : 'bg-slate-100'} ${accentColor}`}>
        {number}
      </div>
      <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
      <p className={isDark ? 'text-white/60' : 'text-slate-600'}>{description}</p>
    </div>
  );
};
