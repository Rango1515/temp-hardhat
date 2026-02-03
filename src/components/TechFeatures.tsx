import { Mail, FolderOpen, Download, HardDrive, Lock, Database } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const techFeatures = [
  {
    icon: Mail,
    title: "Professional Email Hosting",
    description: "Get a custom email (you@yourbrand.com) that makes you look legit to your clients. Unlimited accounts included.",
  },
  {
    icon: FolderOpen,
    title: "Advanced File Manager",
    description: "Full control over your site files with our easy-to-use browser-based file manager plus FTP access.",
  },
  {
    icon: Download,
    title: "One-Click Installer",
    description: "Install WordPress, portfolios, online shops, and 100+ apps with a single click.",
  },
  {
    icon: HardDrive,
    title: "Lightning NVMe SSDs",
    description: "Enterprise-grade NVMe SSD storage for blazing fast page loads and reliability.",
  },
  {
    icon: Lock,
    title: "Free SSL Certificates",
    description: "Every site gets automatic HTTPS encryption - no extra fees, ever.",
  },
  {
    icon: Database,
    title: "Automatic Backups",
    description: "Daily backups of your website and database. Restore anytime with one click.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "100+", label: "One-Click Apps" },
  { value: "24/7", label: "Expert Support" },
  { value: "<1s", label: "Page Load Times" },
];

const TechFeatures = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Under The Hood
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            POWERFUL
            <span className="text-gradient"> FEATURES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to run your business online. No hidden fees, no surprises.
          </p>
        </AnimatedSection>

        {/* Stats row */}
        <AnimatedSection animation="fade-up" delay={100} className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center card-hover"
              >
                <div className="text-4xl md:text-5xl font-display text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techFeatures.map((feature, index) => (
            <AnimatedSection
              key={feature.title}
              animation="fade-up"
              delay={150 + index * 50}
            >
              <div className="glass rounded-2xl p-6 h-full card-hover group">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/30 group-hover:glow transition-all group-hover:scale-105">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechFeatures;
