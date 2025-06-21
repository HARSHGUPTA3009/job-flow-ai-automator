
import { Card } from "@/components/ui/card";

export const Features = () => {
  const features = [
    {
      title: "AI-Powered Applications",
      description: "Generate personalized cover letters and optimize your applications using advanced AI technology.",
      icon: "🤖"
    },
    {
      title: "Resume Analysis",
      description: "Get ATS-friendly score analysis and optimization suggestions for your resume.",
      icon: "📄"
    },
    {
      title: "Job Matching",
      description: "Find relevant job opportunities automatically using intelligent matching algorithms.",
      icon: "🎯"
    },
    {
      title: "Email Automation",
      description: "Send personalized follow-up emails and cold outreach messages automatically.",
      icon: "📧"
    },
    {
      title: "Real-time Analytics",
      description: "Track application status, response rates, and optimize your job search strategy.",
      icon: "📊"
    },
    {
      title: "Workflow Integration",
      description: "Seamlessly integrate with your existing tools through n8n automation workflows.",
      icon: "🔗"
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
