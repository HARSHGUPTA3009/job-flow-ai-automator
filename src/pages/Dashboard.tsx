import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Mail, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [emailResults, setEmailResults] = useState<{ email: string; content: string }[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  interface ATSResult {
    score: number;
    summary: string;
    suggestions: string[];
    detected_skills: string[];
  }
  const [atsResult, setATSResult] = useState<ATSResult | null>(null);

  useEffect(() => {
    fetch("https://jobflow-backend-ai.onrender.com/auth/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          navigate("/signin");
        } else {
          if (data.user?.name) setUserName(data.user.name);
        }
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        navigate("/signin");
      });
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const res = await fetch("https://jobflow-backend-ai.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        navigate("/signin");
      } else {
        console.error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const convertToCsvUrl = (sheetUrl: string): string => {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || match.length < 2) return sheetUrl;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  };

  const handleATSCheck = async () => {
    if (!resumeFile) {
      alert("Please upload a resume first");
      return;
    }

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const res = await fetch("https://harshwillmakethis.app.n8n.cloud/webhook-test/atscheck", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setATSResult(data);
    } catch (error) {
      console.error("ATS check failed:", error);
      alert("Something went wrong during ATS check.");
    }
  };

  const handleColdEmailSetup = async () => {
    if (!googleSheetUrl || !userName.trim()) {
      alert("Please provide both Google Sheets URL and your name");
      return;
    }

    setLoadingEmails(true);
    setEmailResults([]);

    const formattedUrl = convertToCsvUrl(googleSheetUrl);

    try {
      const res = await fetch("https://harshwillmakethis.app.n8n.cloud/webhook-test/coldemail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: formattedUrl, yourName: userName }),
      });

      const data = await res.json();

      if (!Array.isArray(data)) throw new Error("Invalid data format from backend");

      setEmailResults(
        data.map((item: { email: string; content: string }) => ({
          ...item,
          content: item.content.replace(/\[Your Name\]/gi, userName),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch cold emails:", err);
      alert("Something went wrong.");
    }

    setLoadingEmails(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AutoJob Flow
            </div>
            <Button
              variant="outline"
              className="border-gray-600 text-black-300 hover:text-black-900 hover:bg-gray-800"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Automate your job search with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cold Email Automation */}
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
                <Label htmlFor="yourName" className="text-gray-300">Your Name</Label>
                <Input
                  id="yourName"
                  type="text"
                  placeholder="e.g., Harsh Gupta"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
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
                disabled={!googleSheetUrl || !userName.trim()}
              >
                <Mail className="mr-2 h-4 w-4" />
                Setup Cold Email Campaign
              </Button>
              {loadingEmails && <p className="text-sm text-gray-400">Generating emails...</p>}
              {emailResults.length > 0 && (
                <div className="mt-4 space-y-6 max-h-96 overflow-y-auto">
                  {emailResults.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 text-white">
                      <p className="text-sm text-gray-400 mb-1"><strong>To:</strong> {item.email}</p>
                      <pre className="text-sm whitespace-pre-wrap bg-gray-900/40 p-3 rounded text-gray-300">{item.content}</pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
