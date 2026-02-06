import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { seoPages } from "@/lib/seoContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useSmoothScroll";
import {
  HardHat,
  CheckCircle2,
  ArrowRight,
  Phone,
  ChevronDown,
  Star,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ServicePage = () => {
  const { slug } = useParams<{ slug: string }>();
  useScrollToTop();

  const page = slug ? seoPages[slug] : null;

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", page.metaDescription);
    }
    return () => {
      document.title =
        "Hardhat Hosting | Affordable Website Design & Hosting for Contractors";
    };
  }, [page]);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">
            Page Not Found
          </h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <HardHat className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">
                Hardhat Hosting
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 tracking-wide">
              {page.heroHeading}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {page.heroSubheading}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#contact">
                <Button size="lg" className="glow text-lg px-8">
                  <Phone className="w-5 h-5 mr-2" />
                  {page.ctaText}
                </Button>
              </Link>
              <a href="tel:+19096874971">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Call (909) 687-4971
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {page.introText}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {page.features.map((feature, i) => {
              const icons = [Zap, Shield, Star, Clock];
              const Icon = icons[i % icons.length];
              return (
                <div
                  key={feature.title}
                  className="bg-background border border-border/40 rounded-xl p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
              Why Choose Hardhat Hosting
            </h2>
            <div className="space-y-4">
              {page.whyUs.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-lg text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Quick View */}
      <section className="py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            No hidden fees. No long-term contracts. Just professional websites
            at honest prices.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Standard",
                price: "$300",
                hosting: "$25/mo",
                desc: "Professional single-page website",
              },
              {
                name: "Advanced",
                price: "$500",
                hosting: "$35/mo",
                desc: "Multi-page site with advanced SEO",
              },
              {
                name: "Custom",
                price: "$1,500+",
                hosting: "$50/mo",
                desc: "Fully custom design & features",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="bg-background border border-border/40 rounded-xl p-6 text-center hover:border-primary/40 transition-colors"
              >
                <h3 className="font-display text-xl text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-3xl font-bold text-primary mb-1">
                  {plan.price}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  + {plan.hosting} hosting
                </p>
                <p className="text-muted-foreground text-sm">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {page.faqItems.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/40 rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Get a professional website that works as hard as you do. Contact us
            today for a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/#contact">
              <Button size="lg" className="glow text-lg px-8">
                Get Your Free Quote <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="tel:+19096874971">
              <Button variant="outline" size="lg" className="text-lg px-8">
                <Phone className="w-5 h-5 mr-2" /> (909) 687-4971
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicePage;
