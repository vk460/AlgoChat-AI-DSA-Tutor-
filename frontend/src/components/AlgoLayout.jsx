import { useState, useEffect } from 'react';
import { 
  Search, Brain, Eye, Gamepad2, Code2, Video, 
  User, Zap, Sparkles, X, Send, Sun, Moon,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../config";

const modes = [
  { id: "learn", label: "Learn", icon: Brain },
  { id: "visualize", label: "Visualize", icon: Eye },
  { id: "practice", label: "Practice", icon: Gamepad2 },
  { id: "code", label: "Code", icon: Code2 },
  { id: "video", label: "Video Tutor", icon: Video },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

export default function AlgoLayout({ children, activeMode, onModeChange, codeContext }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [messages, setMessages] = useState([
    { role: "assistant", text: "👋 Hi! I'm your AI tutor. I can help you understand algorithms, give hints, or explain concepts." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = { role: "user", text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Enhanced query with code context if in code mode
      let finalQuery = inputValue;
      if (activeMode === 'code' && codeContext) {
        finalQuery = `I am currently in the Code Practice mode. My code is:\n\`\`\`python\n${codeContext}\n\`\`\`\n\nQuestion: ${inputValue}`;
      }

      const response = await fetch(`${API_URL}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: finalQuery,
          session_id: "floating_chat_" + (localStorage.getItem('dsa_mentor_user') ? JSON.parse(localStorage.getItem('dsa_mentor_user')).email : "guest")
        }),
      });

      const data = await response.json();
      // For floating assistant, we strip out JSON blocks and just keep text for simplicity
      const cleanText = (data.answer || "").replace(/```(d3-json|quiz-json|assignment-prompt)[\s\S]*?```/g, "").trim();
      
      setMessages(prev => [...prev, { role: "assistant", text: cleanText || "I understand. How else can I help?" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I'm having trouble connecting to the brain center right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Top Navbar */}
      <nav className="glass-panel-strong border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4 relative z-50">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-border">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-display text-lg font-bold leading-none neon-text">AlgoLab</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Learning Lab</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 glass-panel px-3 py-2 max-w-xs flex-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search algorithms..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1 glass-panel p-1">
          {modes.map((mode) => {
            const isActive = activeMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive ? "bg-primary/15 text-primary border border-primary/30 glow-border" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm border-l border-border/50 pl-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-muted-foreground text-xs font-semibold">Level 12</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center hover:bg-secondary/30 transition-colors">
            <User className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto min-h-0">
        {children}
      </main>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel-strong glow-border mb-4 w-80 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Tutor</p>
                    <p className="text-[10px] text-muted-foreground">Always here to help</p>
                  </div>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 h-80 overflow-y-auto custom-scrollbar flex flex-col">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "glass-panel text-foreground rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="glass-panel p-3 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex items-center gap-2 glass-panel px-3 py-2"
                >
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything..." 
                    className="bg-transparent text-sm text-foreground outline-none flex-1" 
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    className={`text-primary ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95 transition-transform"}`}
                    disabled={isLoading}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isAiOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground animate-pulse-glow"
          }`}
        >
          {isAiOpen ? <X className="w-5 h-5" /> : <Brain className="w-6 h-6" />}
        </motion.button>
      </div>
    </div>
  );
}
