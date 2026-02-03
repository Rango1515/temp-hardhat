import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import TechFeatures from "@/components/TechFeatures";
import ComparisonTable from "@/components/ComparisonTable";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <TechFeatures />
      <ComparisonTable />
      <Portfolio />
      <Contact />
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
