import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Mail, BarChart3, CheckCircle2, AlertCircle, Lightbulb, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCEPTED_RESUME_TYPES = ".pdf,.doc,.docx,.txt,.js,.ts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [emailResults, setEmailResults] = useState<{ email: string; content: string }[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingATS, setLoadingATS] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  interface ATSResult {
    score: number;
    summary: string;
    suggestions: string[];
    detected_skills: string[];
  }
  const [atsResult, setATSResult] = useState<ATSResult | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/status`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          navigate("/signin");
        } else {
          if (data.user?.name) setUserName(data.user.name);
        }
      })
      .catch(() => navigate("/signin"));
  }, [navigate]);

  const handleResumeUpload = (file: File) => {
    setResumeFile(file);
    setATSResult(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const convertToCsvUrl = (sheetUrl: string): string => {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || match.length < 2) return sheetUrl;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "js" || ext === "ts") return <Code2 className="w-5 h-5 text-yellow-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-green-400";
    if (score >= 60) return "stroke-yellow-400";
    return "stroke-red-400";
  };

  const handleATSCheck = async () => {
    if (!resumeFile) {
      alert("Please upload a resume first");
      return;
    }
    setLoadingATS(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const response = await fetch(`${BACKEND_URL}/ai/ats-upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Backend error: ${response.status}`);
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
      const formattedUrl = convertToCsvUrl(googleSheetUrl);
      const sheetResponse = await fetch(formattedUrl);
      if (!sheetResponse.ok) throw new Error("Failed to fetch Google Sheet");

      const csvText = await sheetResponse.text();
      const rows = csvText.split("\n").slice(1);
      const contacts = rows
        .filter((row) => row.trim())
        .map((row) => {
          const [contactName, companyName, jobTitle, contactEmail] =
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          return {
            companyName: companyName?.trim(),
            contactEmail: contactEmail?.trim(),
            contactName: contactName?.trim(),
            jobTitle: jobTitle?.trim(),
          };
        })
        .filter((c) => c.companyName && c.contactEmail);

      if (contacts.length === 0) throw new Error("No valid contacts found in sheet");

      const response = await fetch(`${BACKEND_URL}/ai/cold-emails`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, contacts }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Cold email generation failed");
      }

      const data = await response.json();
      if (!Array.isArray(data.emails)) throw new Error("Invalid cold email response format");
      setEmailResults(data.emails);
    } catch (err) {
      console.error("Cold email generation failed:", err);
      alert("Something went wrong while generating emails. Please check your Google Sheets URL and try again.");
    } finally {
      setLoadingEmails(false);
    }
  };

  // Circular score ring
  const ScoreRing = ({ score }: { score: number }) => {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
          <circle
            cx="44" cy="44" r={r} fill="none" strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${getScoreRingColor(score)} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Automate your job search with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── ATS Resume Check ── */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-white" />
                <CardTitle className="text-white text-lg">ATS Resume Check</CardTitle>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Upload your resume — PDF, DOCX, or JS/TS file — to get an ATS score and improvement suggestions powered by Groq AI.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Upload zone */}
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  Upload Resume <span className="text-gray-500">(PDF, DOCX, JS, TS)</span>
                </Label>
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200
                    ${dragOver ? "border-white bg-gray-700/60" : "border-gray-600 bg-gray-800/50 hover:bg-gray-800"}
                    ${resumeFile ? "border-gray-500" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
                    {resumeFile ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          {getFileIcon(resumeFile)}
                          <span className="text-sm text-white font-medium truncate max-w-[200px]">
                            {resumeFile.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {(resumeFile.size / 1024).toFixed(1)} KB — click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-600 mt-1">PDF · DOCX · JS · TS · TXT</p>
                      </>
                    )}
                  </div>
                  <input
                    id="resume"
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_RESUME_TYPES}
                    onChange={handleFileInputChange}
                  />
                </label>
              </div>

              <Button
                onClick={handleATSCheck}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium"
                disabled={!resumeFile || loadingATS}
              >
                <FileText className="mr-2 h-4 w-4" />
                {loadingATS ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full inline-block" />
                    Analyzing...
                  </span>
                ) : "Run ATS Check"}
              </Button>

              {/* ATS Result */}
              {atsResult && (
                <div className="mt-2 p-5 bg-gray-800/80 rounded-xl border border-gray-700 space-y-5">
                  {/* Score row */}
                  <div className="flex items-center gap-5">
                    <ScoreRing score={atsResult.score} />
                    <div>
                      <p className="text-white font-semibold text-base mb-1">ATS Score</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{atsResult.summary}</p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {atsResult.suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm font-medium">Suggestions</span>
                      </div>
                      <ul className="space-y-1.5">
                        {atsResult.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-yellow-500 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {atsResult.detected_skills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-white text-sm font-medium">Detected Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {atsResult.detected_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Cold Email Automation ── */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white text-lg">Cold Email Automation</CardTitle>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Connect your Google Sheet with contacts to generate personalized cold emails with Groq AI.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="yourName" className="text-gray-300 text-sm">Your Name</Label>
                <Input
                  id="yourName"
                  type="text"
                  placeholder="e.g., Harsh Gupta"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="sheetUrl" className="text-gray-300 text-sm">Google Sheets URL</Label>
                <Input
                  id="sheetUrl"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-gray-400"
                />
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Required sheet columns</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: "Contact Name", required: false },
                    { label: "Company Name", required: true },
                    { label: "Job Title", required: false },
                    { label: "Contact Email", required: true },
                  ].map((col) => (
                    <div key={col.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className={col.required ? "text-white" : "text-gray-500"}>•</span>
                      {col.label}
                      {col.required && (
                        <span className="text-red-400 text-[10px]">required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleColdEmailSetup}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium"
                disabled={!googleSheetUrl || !userName.trim() || loadingEmails}
              >
                <Mail className="mr-2 h-4 w-4" />
                {loadingEmails ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full inline-block" />
                    Generating emails...
                  </span>
                ) : "Generate Cold Emails"}
              </Button>

              {/* Email Results */}
              {emailResults.length > 0 && (
                <div className="mt-2 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    {emailResults.length} email{emailResults.length > 1 ? "s" : ""} generated
                  </p>
                  {emailResults.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-700 rounded-xl bg-gray-900/60"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        <p className="text-xs text-gray-400">{item.email}</p>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap bg-gray-900/60 p-3 rounded-lg text-gray-300 leading-relaxed border border-gray-800">
                        {item.content}
                      </pre>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.content)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Copy to clipboard
                      </button>
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