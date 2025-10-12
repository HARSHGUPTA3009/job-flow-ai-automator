
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Navigation } from "@/components/Navigation";
import { Stats } from "@/components/Stats";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { About } from "@/components/About";
import Placement from "./Placement";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />
      <Hero />
      <Placement/>
      <Features />
      <About/>
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
