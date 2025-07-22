import { Card } from "@/components/ui/card";
import { Github, Linkedin, ExternalLink } from "lucide-react";

export const About = () => {
  const techStack = [
    { name: "MongoDB", icon: "🍃", category: "Database" },
    { name: "Express.js", icon: "⚡", category: "Backend" },
    { name: "React", icon: "⚛️", category: "Frontend" },
    { name: "Node.js", icon: "🟢", category: "Runtime" },
    { name: "Vite", icon: "🚀", category: "Build Tool" },
    { name: "Vercel", icon: "▲", category: "Hosting" },
    { name: "Render", icon: "🔷", category: "Backend Hosting" },
    { name: "Lovable", icon: "💜", category: "AI Development" },
    { name: "n8n", icon: "🔗", category: "Automation" },
    { name: "Gemini AI", icon: "✨", category: "AI Model" },
    { name: "OpenAI", icon: "🤖", category: "AI Model" }
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            About AutoJob Flow
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Revolutionizing the job application process with AI-powered automation
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Project Description */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                The Vision
              </h3>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  AutoJob Flow is an innovative platform that transforms the traditionally 
                  time-consuming job application process into an automated, intelligent system. 
                  By leveraging cutting-edge AI technology, we help job seekers focus on what 
                  truly matters - preparing for interviews and advancing their careers.
                </p>
                <p>
                  Our platform combines the power of multiple AI models, workflow automation, 
                  and intelligent matching algorithms to create personalized cover letters, 
                  optimize resumes for ATS systems, and automatically apply to relevant job 
                  opportunities.
                </p>
                <p>
                  Built with modern web technologies and scalable architecture, AutoJob Flow 
                  represents the future of job searching - efficient, intelligent, and 
                  results-driven.
                </p>
              </div>
            </Card>

            {/* Developer Info */}
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Developer
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  HG
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">Harsh Gupta</h4>
                  <p className="text-gray-400">Full Stack Developer & AI Enthusiast</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href="https://github.com/harshgupta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com/in/harshgupta" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Developer
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  RG
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">Reyansh Gahlot</h4>
                  <p className="text-gray-400">Full Stack Developer & AI Enthusiast</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href="https://github.com/reyansh17" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com/in/reyanshgahlot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Card>
          </div>
          

          {/* Tech Stack */}
          <div>
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                Tech Stack
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {techStack.map((tech, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-2xl">{tech.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{tech.name}</h4>
                      <p className="text-sm text-gray-400">{tech.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};