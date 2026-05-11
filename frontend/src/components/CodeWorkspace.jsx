import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Send, AlertTriangle, 
  Lightbulb, ChevronDown, 
  ChevronUp, Terminal, Brain
} from "lucide-react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import API_URL from "../config";
import "./CodeWorkspace.css";

const languages = [
  { id: "python", label: "Python 3.x", starter: "def main():\n    # Type any code here\n    print(\"Hello AlgoCore\")\n\nif __name__ == \"__main__\":\n    main()" },
  { id: "java", label: "Java 17", starter: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello AlgoCore\");\n    }\n}" }
];

export default function CodeWorkspace({ onCodeChange }) {
  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState(language.starter);
  const [stdin, setStdin] = useState("");
  const [isStdinOpen, setIsStdinOpen] = useState(false);
  const [output, setOutput] = useState("Execute any Python/Java code\nSystem output will appear here");
  const [aiHints, setAiHints] = useState("");
  const [activeTab, setActiveTab] = useState("output");
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const outputRef = useRef(null);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, stdin, language]);

  // Report code changes to parent
  useEffect(() => {
    if (onCodeChange) onCodeChange(code);
  }, [code, onCodeChange]);

  // Real-time Line-by-Line Analysis (Debounced)
  const [liveHints, setLiveHints] = useState([]);
  const [liveEncouragement, setLiveEncouragement] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!code || code.length < 20) return; // Only analyze if there's enough code
      
      try {
        const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
        const response = await fetch(`${API_URL}/api/analyze-live/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code, 
            language: language.id,
            user_id: user.id
          }),
        });
        const data = await response.json();
        if (data.intelligence) {
          setLiveHints(data.intelligence.live_hints || []);
          setLiveEncouragement(data.intelligence.encourage || "");
        }
      } catch (err) {
        console.warn("Live analysis link unstable.");
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [code, language]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(lang.starter);
  };

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setActiveTab("output");
    setOutput("Running...\n");
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_URL}/api/run/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stdin, language: language.id }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.execution_output || "No output.";
      setOutput(result);
    } catch (err) {
      console.error("Run failed:", err);
      if (err.name === 'AbortError') {
        setOutput(`RUNTIME ERROR: Connection timed out. The backend server might be frozen or offline.`);
      } else {
        setOutput(`RUNTIME ERROR: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, stdin, language]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setActiveTab("analysis");
    setAiHints("Performing deep structural evaluation...");
    
    try {
      const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
      const response = await fetch(`${API_URL}/api/submit-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          language: language.id,
          user_id: user.id,
          session_id: "submission_" + Date.now()
        }),
      });
      const data = await response.json();
      
      if (data.execution_output) setOutput(data.execution_output);
      
      const analysis = data.analysis;
      setAiHints(analysis.explanation + "\n\n" + (analysis.personalized_feedback || ""));
    } catch (err) {
      setAiHints("Submission failed. Neural link severed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    setActiveTab("analysis");
    setAiHints("Deconstructing logic flow...");
    
    try {
      const response = await fetch(`${API_URL}/api/explain/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: language.id }),
      });
      const data = await response.json();
      setAiHints(data.explanation || "Deconstruction failed.");
    } catch (err) {
      setAiHints("Link Error: " + err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="code-workspace">
      
      {/* ---------------- EDITOR SECTION ---------------- */}
      <div className="editor-container">
        
        <div className="editor-top-bar">
          <div className="window-dots">
            <div className="dot red" />
            <div className="dot yellow" />
            <div className="dot green" />
          </div>
          <div className="tab active">{language.label} Workspace</div>
          <div className="editor-actions">
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang)}
                className="icon-btn-sm"
                style={{ color: language.id === lang.id ? 'var(--accent-primary)' : 'inherit' }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="code-textarea-wrapper">
          <Editor
            height="100%"
            language={language.id.toLowerCase()}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 }
            }}
          />
        </div>

        <div className="stdin-container">
          <div className="stdin-header" onClick={() => setIsStdinOpen(!isStdinOpen)}>
            <span>Standard Input (stdin)</span>
            {isStdinOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
          {isStdinOpen && (
            <textarea
              className="stdin-textarea"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input here..."
            />
          )}
        </div>

        <div className="editor-bottom-bar">
          <button className="run-button" onClick={handleRun} disabled={isLoading}>
            <Play size={16} className={isLoading ? "animate-spin" : ""} />
            {isLoading && activeTab === 'output' ? "Running..." : "Run Code"}
          </button>
          
          <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
            <Send size={16} />
            {isLoading && activeTab === 'analysis' ? "Analyzing..." : "Submit"}
          </button>

          <div className="lang-tag">
            {language.label}
          </div>
        </div>
      </div>

      {/* ---------------- SIDEBAR SECTION ---------------- */}
      <div className="code-meta-sidebar">
        <div className="side-tabs-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div className="panel-tabs">
            <button 
              className={`panel-tab ${activeTab === 'output' ? 'active' : ''}`}
              onClick={() => setActiveTab('output')}
            >
              Console Output
            </button>
            <button 
              className={`panel-tab ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              AI Analysis
            </button>
          </div>

          <div className="panel-content" ref={outputRef}>
            
            {activeTab === 'output' && (
              <div className="console-view">
                <pre>
                  {String(output || "").split('\n').map((line, i) => (
                    <div key={i} style={{
                      color: line.includes('RUNTIME ERROR') ? '#ef4444' : 
                             line.includes('Running...') ? '#3b82f6' : 'inherit',
                      fontWeight: (line.includes('RUNTIME ERROR') || line.includes('Running...')) ? 'bold' : 'normal'
                    }}>
                      {line}
                    </div>
                  ))}
                </pre>
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="box-label">Socratic Feedback</div>
                  <button className="explain-btn" onClick={handleExplain} disabled={isExplaining}>
                    <Brain size={14} />
                    {isExplaining ? "Processing..." : "Deconstruct Logic"}
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="analysis-list">
                    <div className="loading-skeleton" style={{ height: '60px' }}></div>
                    <div className="loading-skeleton" style={{ height: '100px' }}></div>
                  </div>
                ) : (
                  <div className="markdown-content">
                    {/* Live Intelligence Layer */}
                    <AnimatePresence>
                      {liveHints.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="live-hints-overlay"
                        >
                          {liveHints.map((hint, idx) => (
                            <div key={idx} className={`live-hint ${hint.type}`}>
                              <AlertTriangle size={14} />
                              <span>{hint.message}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                      {liveEncouragement && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="live-encouragement"
                        >
                          <Brain size={14} />
                          <span>{liveEncouragement}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <ReactMarkdown>{aiHints || "Run 'Analyze' to generate AI feedback."}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
