
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Mail, BarChart3, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleATSCheck = () => {
    if (!resumeFile) {
      toast({
        title: "Error",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }
    console.log("Starting ATS check for:", resumeFile.name);
    toast({
      title: "ATS Check Started",
      description: "Your resume is being analyzed...",
    });
  };

  const handleColdEmailSetup = () => {
    if (!googleSheetUrl) {
      toast({
        title: "Error",
        description: "Please provide a Google Sheets URL",
        variant: "destructive",
      });
      return;
    }
    console.log("Setting up cold email with sheet:", googleSheetUrl);
    toast({
      title: "Cold Email Setup",
      description: "Your cold email campaign is being configured...",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AutoJob Flow
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.email}</span>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Automate your job search with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ATS Check Section */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-white">ATS Resume Check</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Upload your resume to get an ATS compatibility score and optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume" className="text-gray-300">Upload Resume (PDF/DOCX)</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {resumeFile ? resumeFile.name : "Click to upload or drag and drop"}
                      </p>
                    </div>
                    <input
                      id="resume"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
              </div>
              <Button 
                onClick={handleATSCheck}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={!resumeFile}
              >
                <FileText className="mr-2 h-4 w-4" />
                Run ATS Check
              </Button>
            </CardContent>
          </Card>

          {/* Cold Email Section */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-white">Cold Email Automation</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Connect your Google Sheet with contacts to send personalized cold emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sheetUrl" className="text-gray-300">Google Sheets URL</Label>
                <Input
                  id="sheetUrl"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Required columns in your sheet:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Company Name</li>
                  <li>• Contact Email</li>
                  <li>• Contact Name (optional)</li>
                  <li>• Job Title (optional)</li>
                </ul>
              </div>
              <Button 
                onClick={handleColdEmailSetup}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={!googleSheetUrl}
              >
                <Mail className="mr-2 h-4 w-4" />
                Setup Cold Email Campaign
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
