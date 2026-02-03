import { DemoBanner, DemoFooter } from './DemoShared';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Instagram, Linkedin, Dribbble, Mail } from 'lucide-react';
import portfolioImg from '@/assets/demo-portfolio.jpg';

const projects = [
  { title: "Brand Identity", client: "TechFlow", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600", category: "Branding" },
  { title: "Web Experience", client: "Mindful", image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=600", category: "Web Design" },
  { title: "App Design", client: "FitPro", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600", category: "UI/UX" },
  { title: "Campaign", client: "EcoLiving", image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600", category: "Marketing" },
  { title: "Packaging", client: "Artisan Co", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600", category: "Print" },
  { title: "Motion Graphics", client: "Pulse", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600", category: "Animation" },
];

const PortfolioDemo = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <DemoBanner color="bg-violet-500" textColor="text-white" />
      
      {/* Navigation */}
      <nav className="fixed top-8 left-0 right-0 z-40 mix-blend-difference">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter">THE CREATIVE LAB</div>
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider">
            <a href="#" className="hover:opacity-60 transition-opacity">Work</a>
            <a href="#" className="hover:opacity-60 transition-opacity">About</a>
            <a href="#" className="hover:opacity-60 transition-opacity">Services</a>
            <a href="#" className="hover:opacity-60 transition-opacity">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Instagram className="w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
            <Linkedin className="w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
            <Dribbble className="w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={portfolioImg} alt="Creative workspace" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-6 pt-32">
          <div className="max-w-4xl">
            <div className="overflow-hidden mb-4">
              <p className="text-violet-400 uppercase tracking-widest text-sm animate-fade-in">Designer & Creative Director</p>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-none mb-8 tracking-tighter">
              I CREATE
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">DIGITAL</span>
              <br />
              EXPERIENCES
            </h1>
            <p className="text-neutral-400 text-xl max-w-lg mb-8">Award-winning designer crafting bold brands and memorable digital experiences for forward-thinking companies.</p>
            <Button className="bg-white text-neutral-900 hover:bg-neutral-200 px-8 py-6 text-lg group">
              View My Work <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">Scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-violet-500 to-transparent" />
        </div>
      </section>

      {/* Work Grid */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <div>
              <span className="text-violet-400 uppercase tracking-widest text-sm">Selected Work</span>
              <h2 className="text-5xl font-bold tracking-tight mt-2">Featured Projects</h2>
            </div>
            <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-900">
              View All <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div key={project.title} className={`group cursor-pointer ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <div className="relative overflow-hidden bg-neutral-900 aspect-[4/3]">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform">
                    <span className="text-violet-400 text-sm uppercase tracking-wider">{project.category}</span>
                    <h3 className="text-2xl font-bold">{project.title}</h3>
                    <p className="text-neutral-400">{project.client}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-32 bg-neutral-900">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-violet-400 uppercase tracking-widest text-sm">About Me</span>
              <h2 className="text-5xl font-bold tracking-tight mt-2 mb-6">Let's Create Something Amazing</h2>
              <p className="text-neutral-400 text-lg mb-8">I'm a multidisciplinary designer based in Los Angeles with 10+ years of experience working with startups and Fortune 500 companies alike.</p>
              <div className="flex flex-wrap gap-3">
                {["Branding", "Web Design", "UI/UX", "Motion", "Strategy"].map(skill => (
                  <span key={skill} className="px-4 py-2 border border-neutral-700 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8">Got a project?</h2>
          <Button className="bg-violet-500 hover:bg-violet-400 text-white px-12 py-6 text-xl">
            <Mail className="w-6 h-6 mr-3" /> Let's Talk
          </Button>
        </div>
      </section>

      <DemoFooter name="The Creative Lab" theme="dark" accentColor="bg-violet-500" />
    </div>
  );
};

export default PortfolioDemo;
