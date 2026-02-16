import { Card } from "@/components/ui/card";

export const About = () => {
  const about = [
    {
      title: "Student-Centric Design",
      description: "Built specifically for students navigating campus placements and off-campus recruitment, understanding the unique challenges of the job search journey.",
      icon: "🎓"
    },
    {
      title: "Time-Saving Automation",
      description: "Reduce manual effort by 80% through intelligent automation of applications, emails, and follow-ups, allowing you to focus on interview preparation.",
      icon: "⏱️"
    },
    {
      title: "Data-Driven Insights",
      description: "Track your application pipeline, conversion rates, and response metrics to make informed decisions and optimize your recruitment strategy.",
      icon: "📈"
    },
    {
      title: "Personalized Approach",
      description: "AI-driven customization ensures every application is tailored to the specific job and company, significantly improving your success rate.",
      icon: "🎯"
    },
    {
      title: "Comprehensive Tracking",
      description: "Unified dashboard for on-campus and off-campus opportunities, interview schedules, and offer negotiations all in one place.",
      icon: "📋"
    },
    {
      title: "Scalable Solution",
      description: "From your first application to multiple offers, JobFlow scales with your recruitment journey and adapts to your evolving needs.",
      icon: "🚀"
    }
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            About JobFlow
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            JobFlow is an intelligent recruitment automation platform designed to empower students and early-career professionals in their job search journey. Built on cutting-edge technology including MERN stack, n8n automation, and OpenAI integration, JobFlow transforms the traditionally manual and time-consuming recruitment process into a streamlined, data-driven experience.
          </p>
        </div>

        <div className="mb-16">
          <Card className="bg-gray-900/50 border-gray-800 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              To democratize the job search process by providing students with intelligent tools and automation capabilities that level the playing field. We believe every student deserves access to enterprise-grade recruitment technology, enabling them to compete effectively with greater efficiency and data-backed strategies. Our platform eliminates repetitive tasks, provides actionable insights, and ensures no opportunity is missed.
            </p>
          </Card>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Why JobFlow for Students?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {about.map((about, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors duration-300 p-6">
                <div className="text-4xl mb-4">{about.icon}</div>
                <h4 className="text-xl font-semibold text-white mb-3">
                  {about.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {about.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gray-900/50 border-gray-800 p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💼</span>
              For On-Campus Placements
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Track multiple company drives and batch timelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Monitor cutoffs and eligibility criteria</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Prepare with role-specific resources and tips</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Get placement statistics and success metrics</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              For Off-Campus Opportunities
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>Automated job discovery and application tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>Personalized cover letters and resume optimization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>Intelligent follow-up scheduling and email campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>Response rate analytics and opportunity comparison</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-white mb-4">Powered by Enterprise Technology</h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
            JobFlow leverages industry-leading technologies to deliver a robust and scalable solution. Our stack includes a full-featured MERN application for seamless user experience, n8n workflows for sophisticated automation, OpenAI integration for intelligent content generation, and a specialized Discord bot for convenient access and notifications.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Frontend</p>
              <p className="text-white font-semibold">React + TypeScript</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Backend</p>
              <p className="text-white font-semibold">Node.js + Express</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Database</p>
              <p className="text-white font-semibold">MongoDB</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Automation</p>
              <p className="text-white font-semibold">n8n + OpenAI</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};