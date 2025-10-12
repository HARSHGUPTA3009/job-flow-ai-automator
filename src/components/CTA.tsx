
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have automated their way to their dream jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signin">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 h-auto">
                Start Your Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="!bg-white border-gray-600 text-black-700 hover:text-gray-900 hover:border-gray-500 text-lg px-8 py-4 h-auto">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
