import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Briefcase, Mail, BarChart3, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-16">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-gray-700/30 border border-gray-600/50 rounded-full text-gray-300 text-sm font-semibold mb-4">
              ✨ AI-Powered Job Search Automation
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Land Your Dream Job <br />
            <span className="text-gray-200">
              Faster Than Ever
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Automate your job search with AI-powered tools. Check ATS compatibility, send personalized cold emails, and track applications all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signin">
              <Button className="bg-gray-200 text-black hover:bg-white font-semibold py-6 px-8 text-lg flex items-center gap-2">
                Get Started
                <ArrowRight size={20} />
              </Button>
            </Link>

            <Button 
              variant="outline"
              className="border-gray-500 text-white hover:bg-gray-800 font-semibold py-6 px-8 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-gray-400 text-lg">Everything you need to ace your job search</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card */}
            {[
              {
                icon: <BarChart3 size={24} className="text-gray-300" />,
                title: "ATS Resume Check",
                text: "Get an ATS compatibility score and actionable suggestions to optimize your resume."
              },
              {
                icon: <Mail size={24} className="text-gray-300" />,
                title: "Cold Email Automation",
                text: "Generate personalized cold emails and automate outreach at scale."
              },
              {
                icon: <Briefcase size={24} className="text-gray-300" />,
                title: "Placement Tracker",
                text: "Manage your applications with a unified dashboard and analytics."
              },
              {
                icon: <Zap size={24} className="text-gray-300" />,
                title: "Resume Management",
                text: "Upload, store, and download multiple resume versions for different roles."
              },
              {
                icon: <BarChart3 size={24} className="text-gray-300" />,
                title: "Analytics Dashboard",
                text: "Track funnel metrics and optimize your job search strategy."
              },
              {
                icon: <Briefcase size={24} className="text-gray-300" />,
                title: "AI-Powered Insights",
                text: "Improve your profile and land interviews faster with smart recommendations."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 backdrop-blur-xl hover:border-gray-500 transition"
              >
                <div className="w-12 h-12 bg-gray-700/40 rounded-lg flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Job Search?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of students automating their job search and landing their dream roles.
          </p>
          <Link to="/signin">
            <Button className="bg-gray-200 text-black hover:bg-white font-semibold py-6 px-8 text-lg">
              Start Free Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 AutoJob Flow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
