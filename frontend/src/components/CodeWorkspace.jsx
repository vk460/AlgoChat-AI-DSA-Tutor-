import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Send, AlertTriangle, CheckCircle2, 
  Lightbulb, Copy, RotateCcw, ChevronDown, 
  ChevronUp, Sparkles, Terminal, Brain
} from "lucide-react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import API_URL from "../config";

const defaultPythonCode = `def binary_search(arr, target):
    """
    Finds the index of target in sorted array arr.
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

# Test the function
numbers = [1, 3, 5, 7, 9, 11]
target = 7
result = binary_search(numbers, target)
print(f"Target {target} found at index: {result}")
`;

const challenges = [
  { 
    id: "binary-search", 
    title: "Binary Search", 
    difficulty: "Medium",
    goal: "Implement a binary search algorithm that finds the index of a target value in a sorted array in O(log n) time.",
    inputExample: "arr = [1, 3, 5, 7, 9], target = 5",
    outputExample: "2",
    starterCode: "def binary_search(arr, target):\n    # Your code here\n    pass"
  },
  { 
    id: "bubble-sort", 
    title: "Bubble Sort", 
    difficulty: "Easy",
    goal: "Implement bubble sort to sort an array of integers in ascending order.",
    inputExample: "[64, 34, 25, 12, 22]",
    outputExample: "[12, 22, 25, 34, 64]",
    starterCode: "def bubble_sort(arr):\n    # Your code here\n    pass"
  }
];

export default function CodeWorkspace({ onCodeChange }) {
  const [code, setCode] = useState(defaultPythonCode);
  const [stdin, setStdin] = useState("");
  const [studentProfile, setStudentProfile] = useState(null);

  // Report code changes to parent for AI context
  useEffect(() => {
    if (onCodeChange) onCodeChange(code);
    
    // Debounced "Continuous Analysis" for profiling
    const timer = setTimeout(() => {
      if (code && code !== defaultPythonCode) {
        console.log("Auto-analyzing for profiling...");
        // In a real app, we'd call a 'track-activity' endpoint here
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [code, onCodeChange]);

  // Fetch student profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
        if (user.id) {
          const res = await fetch(`${API_URL}/api/student-profile/?user_id=${user.id}`);
          const data = await res.json();
          setStudentProfile(data);
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
  }, []);
  const [isStdinOpen, setIsStdinOpen] = useState(false);
  const [output, setOutput] = useState("// Click 'Run' to execute code\n// Standard output and errors will appear here");
  const [aiHints, setAiHints] = useState("");
  const [activeTab, setActiveTab] = useState("output");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0]);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    setActiveTab("output");
    setOutput("Executing code on backend...");
    
    try {
      const response = await fetch(`${API_URL}/run/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stdin }),
      });
      const data = await response.json();
      setOutput(data.execution_output || "No output.");
    } catch (err) {
      setOutput("Error connecting to backend: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Switch to analysis tab to show AI feedback
    setActiveTab("analysis");
    setAiHints("Analyzing your code logic and performance...");
    
    try {
      const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
      const response = await fetch(`${API_URL}/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          stdin,
          goal: selectedChallenge.goal,
          user_id: user.id,
          session_id: "code_session_" + Date.now()
        }),
      });
      const data = await response.json();
      setOutput(data.execution_output || "No output.");
      setAiHints(data.hints || "Your code is correct! Keep it up.");
    } catch (err) {
      setAiHints("Failed to get AI analysis. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    setActiveTab("analysis");
    setAiHints("Generating line-by-line explanation...");
    
    try {
      const response = await fetch(`${API_URL}/explain/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setAiHints(data.explanation || "Could not generate explanation.");
    } catch (err) {
      setAiHints("Error: " + err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full workspace-animation">
      {/* Code Editor Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-3 flex flex-col glass-panel-strong glow-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <span className="text-xs text-muted-foreground font-mono ml-2">solution.py</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-white/5 rounded"
              onClick={() => { navigator.clipboard.writeText(code); }}
              title="Copy Code"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-white/5 rounded"
              onClick={() => setCode(selectedChallenge.starterCode)}
              title="Reset Code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/50 bg-black/20">
          <button 
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/15 border border-success/30 text-success text-sm font-medium hover:bg-success/25 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Running..." : "Run"}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-all glow-border disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Submit & Analyze
          </button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Python 3.x
          </span>
        </div>
      </motion.div>

      {/* Right Information/Analysis Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-2 flex flex-col gap-4 overflow-hidden"
      >
        {/* Problem Card */}
        <div className="glass-panel p-4 bg-black/20">
          <div className="flex items-center justify-between mb-3 border-none">
            <h3 className="font-display text-sm font-semibold text-foreground">{selectedChallenge.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              selectedChallenge.difficulty === "Easy" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
            }`}>
              {selectedChallenge.difficulty}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            {selectedChallenge.goal}
          </p>
          <div className="glass-panel p-2.5 font-mono text-xs text-muted-foreground bg-black/30 border-white/5">
            <div className="flex gap-2">
              <span className="text-primary font-bold">Input:</span>
              <span>{selectedChallenge.inputExample}</span>
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-success font-bold">Output:</span>
              <span>{selectedChallenge.outputExample}</span>
            </div>
          </div>
        </div>

        {/* Standard Input Section (Moved to right) */}
        <div className="glass-panel overflow-hidden bg-black/20">
          <div 
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsStdinOpen(!isStdinOpen)}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Terminal className="w-3.5 h-3.5" />
              INPUT (STDIN)
            </div>
            {isStdinOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          <AnimatePresence>
            {isStdinOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input data..."
                  className="stdin-textarea w-full text-[11px] min-h-[60px]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Student Profile Card (Dynamic) */}
        {studentProfile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 bg-primary/5 border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="font-display text-[11px] font-bold text-foreground uppercase tracking-wider">Your Learning Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(studentProfile.understanding || {}).map(([topic, level]) => (
                <div key={topic} className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">{topic}</span>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        level === 'Weak' ? 'bg-destructive w-1/3' : 
                        level === 'Medium' ? 'bg-yellow-500 w-2/3' : 'bg-success w-full'
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-primary flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Focus on: {studentProfile.weak_topics?.join(", ")}
              </span>
            </div>
          </motion.div>
        )}

        {/* Output/Analysis Tabs Panel */}
        <div className="glass-panel-strong flex-1 flex flex-col overflow-hidden bg-black/20">
          <div className="flex border-b border-border/50 bg-black/10">
            <button
              onClick={() => setActiveTab("output")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === "output" ? "text-foreground border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="w-3 h-3" />
              Output
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === "analysis" ? "text-foreground border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="w-3 h-3" />
              AI Analysis
            </button>
          </div>

          <div className="flex-1 p-0 overflow-hidden relative">
            <div className="p-4 h-full overflow-y-auto custom-scrollbar">
              {activeTab === "output" ? (
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {output}
                </pre>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      Socratic AI Tutor
                    </div>
                    <button 
                      onClick={handleExplain}
                      disabled={isExplaining}
                      className="explain-btn"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      {isExplaining ? "Explaining..." : "Explain Code"}
                    </button>
                  </div>
                  
                  <div className="markdown-content text-xs leading-relaxed text-muted-foreground">
                    <ReactMarkdown>
                      {aiHints || "Submit your code or click 'Explain' to get insights from your AI Tutor."}
                    </ReactMarkdown>
                  </div>

                  {isLoading && activeTab === "analysis" && (
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 loading-skeleton" />
                      <div className="h-20 w-full loading-skeleton" />
                      <div className="h-4 w-1/2 loading-skeleton" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
