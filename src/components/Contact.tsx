import { Phone, Mail, MapPin, Clock } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const Contact = () => {
  return (
    <section id="contact" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Get In Touch
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            READY TO GET
            <span className="text-gradient"> STARTED?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Contact us today for a free consultation. We'll discuss your needs 
            and show you how we can help your construction business grow online.
          </p>
        </AnimatedSection>

        <div className="max-w-3xl mx-auto">
          <AnimatedSection animation="fade-up" delay={100}>
            <div className="space-y-8">
              <div className="glass rounded-2xl p-8 card-hover">
                <h3 className="font-display text-2xl text-foreground mb-6">
                  Contact Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <a
                    href="tel:+19096874971"
                    className="flex items-start gap-4 group touch-feedback rounded-lg p-2 -m-2"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 group-hover:glow transition-all group-hover:scale-105">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Call Us</p>
                      <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        (909) 687-4971
                      </p>
                    </div>
                  </a>

                  <a
                    href="mailto:admin@hardhathosting.work"
                    className="flex items-start gap-4 group touch-feedback rounded-lg p-2 -m-2"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 group-hover:glow transition-all group-hover:scale-105">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email Us</p>
                      <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        admin@hardhathosting.work
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-2 -m-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-lg font-semibold text-foreground">
                        Rancho Cucamonga, CA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-2 -m-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <p className="text-lg font-semibold text-foreground">
                        Mon - Fri: 8AM - 6PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 glow group hover:bg-primary/15 transition-colors">
                <h4 className="font-display text-xl text-foreground mb-2">
                  Free Consultation
                </h4>
                <p className="text-muted-foreground">
                  Not sure where to start? Schedule a free 30-minute call with our team 
                  to discuss your website needs.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Contact;
