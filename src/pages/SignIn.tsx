
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from "lucide-react";

const SignIn = () => {
  const handleGoogleSignIn = () => {
    // This will be connected to your backend Google OAuth endpoint
   window.location.href = "https://job-flow-ai-automator.onrender.com/auth/google";

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
              variant="outline"
              className="w-full h-12 font-medium"
            >
              <svg
                className="w-5 h-5 mr-3"
                viewBox="0 0 48 48"
              >
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.215 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.14 35.091 26.677 36 24 36c-5.194 0-9.625-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.791 2.237-2.231 4.166-4.084 5.57l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
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
