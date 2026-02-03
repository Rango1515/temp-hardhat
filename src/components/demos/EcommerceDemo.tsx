import { DemoBanner, DemoFooter } from './DemoShared';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search, Star, Truck, RotateCcw, Shield } from 'lucide-react';
import ecommerceImg from '@/assets/demo-ecommerce.jpg';

const products = [
  { name: "Silk Blouse", price: "$129", image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400" },
  { name: "Cashmere Sweater", price: "$249", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400" },
  { name: "Leather Bag", price: "$389", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400" },
  { name: "Pearl Earrings", price: "$89", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400" },
];

const EcommerceDemo = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <DemoBanner color="bg-rose-400" textColor="text-white" />
      
      {/* Navigation */}
      <nav className="border-b border-neutral-200 sticky top-8 bg-white/95 backdrop-blur z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-serif text-2xl tracking-wider">LUXE BOUTIQUE</div>
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider">
            <a href="#" className="hover:text-rose-500 transition-colors">New In</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Women</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Accessories</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Sale</a>
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 cursor-pointer hover:text-rose-500 transition-colors" />
            <Heart className="w-5 h-5 cursor-pointer hover:text-rose-500 transition-colors" />
            <div className="relative">
              <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-rose-500 transition-colors" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] overflow-hidden">
        <img src={ecommerceImg} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="relative container mx-auto px-6 py-32 flex items-center min-h-[80vh]">
          <div className="max-w-lg">
            <p className="text-rose-500 uppercase tracking-widest text-sm mb-4">Spring Collection 2025</p>
            <h1 className="font-serif text-5xl md:text-7xl mb-6 leading-tight">Timeless Elegance</h1>
            <p className="text-neutral-600 text-lg mb-8">Discover our curated selection of luxury essentials designed for the modern woman.</p>
            <div className="flex gap-4">
              <Button className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-6 uppercase tracking-wider">Shop Now</Button>
              <Button variant="outline" className="border-neutral-900 text-neutral-900 hover:bg-neutral-100 px-8 py-6 uppercase tracking-wider">View Lookbook</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-neutral-200 py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <Truck className="w-5 h-5 text-rose-500" />
              <span className="text-sm uppercase tracking-wider">Free Shipping Over $100</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <RotateCcw className="w-5 h-5 text-rose-500" />
              <span className="text-sm uppercase tracking-wider">30-Day Returns</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-5 h-5 text-rose-500" />
              <span className="text-sm uppercase tracking-wider">Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl mb-4">Best Sellers</h2>
            <p className="text-neutral-500">Our most loved pieces this season</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.name} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-neutral-100 aspect-[3/4] mb-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button className="absolute bottom-4 left-4 right-4 bg-white text-neutral-900 py-3 text-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Quick Add</button>
                  <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-medium mb-1">{product.name}</h3>
                <p className="text-neutral-500">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-neutral-100 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl mb-4">Join The List</h2>
          <p className="text-neutral-600 mb-8 max-w-md mx-auto">Subscribe for exclusive access to new arrivals, sales, and style inspiration.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 border border-neutral-300 focus:border-rose-500 outline-none" />
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3 uppercase tracking-wider">Subscribe</Button>
          </div>
        </div>
      </section>

      <DemoFooter name="Luxe Boutique" theme="light" accentColor="bg-rose-400" />
    </div>
  );
};

export default EcommerceDemo;
