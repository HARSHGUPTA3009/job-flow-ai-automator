
import { Card } from "@/components/ui/card";

export const Features = () => {
  const features = [
  {
    title: "JD-Based ATS Scoring",
    description: "Evaluate resumes against job descriptions using AI-powered ATS analysis with detailed improvement recommendations.",
    icon: "📄"
  },
  {
    title: "Smart Job Tracking",
    description: "Manage applications across multiple stages with a centralized dashboard for seamless job search organization.",
    icon: "🎯"
  },
  {
    title: "Real-Time Leaderboard",
    description: "Track rankings live through WebSockets and Redis-backed synchronization, keeping users engaged and competitive.",
    icon: "🏆"
  },
  {
    title: "AI Cover Letter Generation",
    description: "Generate tailored cover letters based on job requirements to improve application quality and relevance.",
    icon: "✍️"
  },
  {
    title: "Distributed Processing",
    description: "Process ATS analyses asynchronously using Redis and BullMQ, ensuring fast and reliable performance under load.",
    icon: "⚡"
  },
  {
    title: "Application Analytics",
    description: "Gain insights into ATS scores, application progress, and job search performance through interactive analytics.",
    icon: "📊"
  }
];
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to automate and optimize your job application process
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors duration-300 p-6">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
