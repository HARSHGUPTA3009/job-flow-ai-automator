import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Mail, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Environment variables - FIXED: Changed API_URL to VITE_BACKEND_URL

const Dashboard = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [emailResults, setEmailResults] = useState<{ email: string; content: string }[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingATS, setLoadingATS] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_API_URL;


  interface ATSResult {
    score: number;
    summary: string;
    suggestions: string[];
    detected_skills: string[];
  }
  const [atsResult, setATSResult] = useState<ATSResult | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/status`, {
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

  // Extract text from PDF/DOCX file
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          // For PDF files, you might need a library like pdf-parse
          // For now, we'll use a simple text extraction
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

const handleATSCheck = async () => {
  if (!resumeFile) {
    alert("Please upload a resume first");
    return;
  }

  setLoadingATS(true);

  try {
    // 🔥 Create FormData
    const formData = new FormData();
    formData.append("file", resumeFile);

    // 🔥 Call backend PDF route
    const response = await fetch(`${BACKEND_URL}/ai/ats-upload`, {
      method: "POST",
      credentials: "include",
      body: formData,   // IMPORTANT: no headers here
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Backend error: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      typeof data.score !== "number" ||
      !Array.isArray(data.suggestions) ||
      !Array.isArray(data.detected_skills)
    ) {
      throw new Error("Invalid ATS response format");
    }

    setATSResult(data);

  } catch (error) {
    console.error("ATS check failed:", error);
    alert("Something went wrong during ATS check.");
  } finally {
    setLoadingATS(false);
  }
};


const handleColdEmailSetup = async () => {
  if (!googleSheetUrl || !userName.trim()) {
    alert("Please provide both Google Sheets URL and your name");
    return;
  }
  


  setLoadingEmails(true);
  setEmailResults([]);

  try {
    // Convert sheet URL to CSV export
    const formattedUrl = convertToCsvUrl(googleSheetUrl);
    const sheetResponse = await fetch(formattedUrl);

    if (!sheetResponse.ok) {
      throw new Error("Failed to fetch Google Sheet");
    }

    const csvText = await sheetResponse.text();

    // Parse CSV
    const rows = csvText.split("\n").slice(1);
    const contacts = rows
      .filter((row) => row.trim())
      .map((row) => {
        const [contactName, companyName, jobTitle, contactEmail] =row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        return {
          companyName: companyName?.trim(),
          contactEmail: contactEmail?.trim(),
          contactName: contactName?.trim(),
          jobTitle: jobTitle?.trim(),
        };
      })
      .filter((c) => c.companyName && c.contactEmail);

    if (contacts.length === 0) {
      throw new Error("No valid contacts found in sheet");
    }

    // 🔥 Call YOUR backend once
    const response = await fetch(`${BACKEND_URL}/ai/cold-emails`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName,
        contacts,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || "Cold email generation failed");
    }

    const data = await response.json();
    if (!Array.isArray(data.emails)) {
      throw new Error("Invalid cold email response format");
    }
        if (!data || !Array.isArray(data.emails)) {
      throw new Error("Invalid cold email response format");
    }

    setEmailResults(data.emails);

    /**
     * Expected backend response:
     * [
     *   { email: string, content: string }
     * ]
     */

    if (!Array.isArray(data)) {
      throw new Error("Invalid cold email response format");
    }

    setEmailResults(data);
  } catch (err) {
    console.error("Cold email generation failed:", err);
    alert(
      "Something went wrong while generating emails. Please check your Google Sheets URL and try again."
    );
  } finally {
    setLoadingEmails(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Main Dashboard Content - Added pt-24 for navbar spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Automate your job search with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ATS Resume Check */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-white-400" />
                <CardTitle className="text-white">ATS Resume Check</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Upload your resume to get an ATS compatibility score and optimization suggestions powered by Grok AI
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
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
              </div>
              <Button
                onClick={handleATSCheck}
                className="w-full bg-white hover:bg-gray-100 text-black"
                disabled={!resumeFile || loadingATS}
              >
                <FileText className="mr-2 h-4 w-4" />
                {loadingATS ? "Analyzing with Grok AI..." : "Run ATS Check"}
              </Button>
              {atsResult && (
                <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700 text-white">
                  <h2 className="text-xl font-semibold text-white-400 mb-2">ATS Score: {atsResult.score}/100</h2>
                  <p className="mb-2 text-gray-300">{atsResult.summary}</p>
                  <h3 className="font-medium text-white mb-1">Suggestions:</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                    {atsResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <h3 className="font-medium text-white mt-4 mb-1">Detected Skills:</h3>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.detected_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-600/30 text-blue-300 text-sm rounded-full border border-blue-500/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cold Email Automation */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-white">Cold Email Automation</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Connect your Google Sheet with contacts to generate personalized cold emails with Grok AI
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
                className="w-full bg-white hover:bg-gray-100 text-black"
                disabled={!googleSheetUrl || !userName.trim() || loadingEmails}
              >
                <Mail className="mr-2 h-4 w-4" />
                {loadingEmails ? "Generating with Grok AI..." : "Generate Cold Emails"}
              </Button>
              {loadingEmails && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  <p className="text-sm text-gray-400 ml-3">Generating personalized emails...</p>
                </div>
              )}
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