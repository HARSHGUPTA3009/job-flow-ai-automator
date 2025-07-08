import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

export const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      users: "5 free users",
      features: [
        { name: "5 job applications per month", included: true },
        { name: "Basic AI cover letters", included: true },
        { name: "Resume analysis", included: true },
        { name: "Email support", included: true },
        { name: "Advanced AI optimization", included: false },
        { name: "Unlimited applications", included: false },
        { name: "Priority support", included: false },
        { name: "Custom workflows", included: false }
      ],
      popular: false
    },
    {
      name: "Monthly",
      price: "$29.99",
      period: "/month",
      description: "Best for active job seekers",
      users: "Unlimited users",
      features: [
        { name: "Unlimited job applications", included: true },
        { name: "Advanced AI cover letters", included: true },
        { name: "Resume optimization", included: true },
        { name: "Email automation", included: true },
        { name: "Real-time analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Custom workflows", included: true },
        { name: "API access", included: false }
      ],
      popular: true
    },
    {
      name: "Yearly",
      price: "$199.99",
      period: "/year",
      description: "Best value for professionals",
      users: "Unlimited users",
      features: [
        { name: "Everything in Monthly", included: true },
        { name: "API access", included: true },
        { name: "Custom integrations", included: true },
        { name: "Advanced analytics", included: true },
        { name: "White-label options", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom AI training", included: true },
        { name: "SLA guarantee", included: true }
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your job search needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-purple-500/50 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-lg">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
                <p className="text-purple-300 font-medium">{plan.users}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-500'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Link to="/signin" className="block">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {plan.name === 'Free' ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};