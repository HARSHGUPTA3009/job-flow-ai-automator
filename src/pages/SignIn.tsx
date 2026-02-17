
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from "lucide-react";

const SignIn = () => {
  const handleGoogleSignIn = () => {
    // This will be connected to your backend Google OAuth endpoint
   window.location.href = "https://jobflow-backend-ai.onrender.com/auth/google";

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold text-gray-200 hover:text-white transition mb-4">
            AutoJob Flow
          </div>
          <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to continue automating your job search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 h-auto"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
