import { DemoBanner, DemoFooter } from './DemoShared';
import { Button } from '@/components/ui/button';
import { Phone, Clock, MapPin, Star, Scissors, Sparkles, Heart, Calendar } from 'lucide-react';
import salonImg from '@/assets/demo-salon.jpg';

const services = [
  { name: "Haircut & Style", price: "$65+", duration: "45 min" },
  { name: "Color & Highlights", price: "$120+", duration: "2 hrs" },
  { name: "Balayage", price: "$180+", duration: "3 hrs" },
  { name: "Keratin Treatment", price: "$250+", duration: "2.5 hrs" },
  { name: "Manicure & Pedicure", price: "$75", duration: "1 hr" },
  { name: "Facial Treatment", price: "$95+", duration: "1 hr" },
];

const team = [
  { name: "Sofia Martinez", role: "Master Stylist", image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400" },
  { name: "Emma Chen", role: "Color Specialist", image: "https://images.unsplash.com/photo-1595959183082-7b570b7e1dfa?w=400" },
  { name: "Olivia Kim", role: "Nail Artist", image: "https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?w=400" },
];

const reviews = [
  { name: "Jennifer R.", rating: 5, text: "The best salon experience I've ever had! Sofia is amazing with color." },
  { name: "Michelle T.", rating: 5, text: "Finally found my forever salon. The atmosphere is so relaxing." },
];

const SalonDemo = () => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
      <DemoBanner color="bg-rose-300" textColor="text-rose-900" />
      
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur border-b border-rose-100 sticky top-8 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-400" />
            <span className="text-2xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Glow Beauty Studio</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider" style={{ fontFamily: "system-ui" }}>
            <a href="#" className="hover:text-rose-500 transition-colors">Services</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Team</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Gallery</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Reviews</a>
          </div>
          <Button className="bg-rose-400 hover:bg-rose-500 text-white" style={{ fontFamily: "system-ui" }}>
            <Calendar className="w-4 h-4 mr-2" /> Book Now
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] overflow-hidden">
        <img src={salonImg} alt="Salon interior" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="relative container mx-auto px-6 py-32 flex items-center min-h-[80vh]">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-rose-500 uppercase tracking-widest text-sm" style={{ fontFamily: "system-ui" }}>Where Beauty Meets Wellness</span>
            </div>
            <h1 className="text-5xl md:text-7xl mb-6 leading-tight italic">Radiate Confidence</h1>
            <p className="text-stone-600 text-lg mb-8" style={{ fontFamily: "system-ui" }}>Experience luxury beauty services in our serene Rancho Cucamonga studio. Your glow-up starts here.</p>
            <div className="flex flex-wrap gap-4" style={{ fontFamily: "system-ui" }}>
              <Button className="bg-rose-400 hover:bg-rose-500 text-white px-8 py-6">Book Appointment</Button>
              <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-6">View Services</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="bg-rose-50 py-6 border-y border-rose-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center" style={{ fontFamily: "system-ui" }}>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-5 h-5 text-rose-400" />
              <span className="text-sm">123 Beauty Lane, Rancho Cucamonga</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-rose-400" />
              <span className="text-sm">Tue-Sat: 9AM - 7PM</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-5 h-5 text-rose-400" />
              <span className="text-sm">(909) 555-GLOW</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Scissors className="w-8 h-8 text-rose-400 mx-auto mb-4" />
            <h2 className="text-4xl italic mb-4">Our Services</h2>
            <p className="text-stone-500" style={{ fontFamily: "system-ui" }}>Premium treatments tailored to you</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {services.map((service) => (
              <div key={service.name} className="bg-white p-6 border border-rose-100 hover:border-rose-300 hover:shadow-lg transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{service.name}</h3>
                  <span className="text-rose-500 font-semibold" style={{ fontFamily: "system-ui" }}>{service.price}</span>
                </div>
                <p className="text-stone-400 text-sm" style={{ fontFamily: "system-ui" }}>{service.duration}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button className="bg-rose-400 hover:bg-rose-500 text-white px-8 py-6" style={{ fontFamily: "system-ui" }}>
              View Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-rose-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl italic mb-4">Meet Our Artists</h2>
            <p className="text-stone-500" style={{ fontFamily: "system-ui" }}>Passionate professionals dedicated to your beauty</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="relative overflow-hidden rounded-full w-48 h-48 mx-auto mb-4 border-4 border-white shadow-lg">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-2xl italic">{member.name}</h3>
                <p className="text-rose-500" style={{ fontFamily: "system-ui" }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl italic mb-4">Client Love</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {reviews.map((review) => (
              <div key={review.name} className="bg-white p-8 border border-rose-100 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-rose-400 text-rose-400" />
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{review.text}"</p>
                <p className="text-rose-500 font-semibold" style={{ fontFamily: "system-ui" }}>{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-rose-400 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl italic mb-6">Ready for Your Glow Up?</h2>
          <p className="text-rose-100 mb-8 max-w-md mx-auto" style={{ fontFamily: "system-ui" }}>Book your appointment today and experience the Glow difference.</p>
          <Button className="bg-white text-rose-500 hover:bg-rose-50 px-8 py-6 text-lg" style={{ fontFamily: "system-ui" }}>
            <Calendar className="w-5 h-5 mr-2" /> Book Your Appointment
          </Button>
        </div>
      </section>

      <DemoFooter name="Glow Beauty Studio" theme="light" accentColor="bg-rose-400" />
    </div>
  );
};

export default SalonDemo;
