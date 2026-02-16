
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
            🚀 AI-Powered Job Application Automation
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
          Automate Your
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
            Job Hunt
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Let AI handle your job applications while you focus on what matters. 
          Upload your resume, get personalized cover letters, and track everything in one place.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link to="/signin">
            
          </Link>
          
        </div>

        <div className="animate-bounce">
          <ArrowDown className="mx-auto text-gray-500 h-6 w-6" />
        </div>
      </div>
    </section>
  );
};
