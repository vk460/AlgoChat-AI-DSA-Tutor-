import { useState, useEffect, useRef } from 'react';
import { 
  Search, Brain, Eye, Gamepad2, Code2, Video, 
  User, Zap, Sparkles, X, Send, Sun, Moon,
  BarChart3, Settings, LogOut, ChevronRight, Globe
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import API_URL from "../config";

const modes = [
  { id: "learn", label: "Concept Hub", icon: Brain, color: "text-primary" },
  { id: "visualize", label: "Lab Visualizer", icon: Eye, color: "text-secondary" },
  { id: "practice", label: "Daily Practice", icon: Gamepad2, color: "text-success" },
  { id: "code", label: "Code Editor", icon: Code2, color: "text-accent" },
  { id: "video", label: "AI Video", icon: Video, color: "text-warning" },
  { id: "games", label: "Algo Games", icon: Sparkles, color: "text-destructive" },
  { id: "progress", label: "Analytics", icon: BarChart3, color: "text-primary" },
];

export default function AlgoLayout({ children, activeMode, onModeChange, codeContext }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([
    { role: "assistant", text: "⚡ System initialized. Ready to decode the algorithms of the universe. What's our first target?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMsg = { role: "user", text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      let finalQuery = inputValue;
      if (activeMode === 'code' && codeContext) {
        finalQuery = `Code Context:\n\`\`\`python\n${codeContext}\n\`\`\`\n\nUser Question: ${inputValue}`;
      }
      const response = await fetch(`${API_URL}/api/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: finalQuery,
          session_id: "floating_chat_" + (localStorage.getItem('dsa_mentor_user') ? JSON.parse(localStorage.getItem('dsa_mentor_user')).email : "guest")
        }),
      });
      const data = await response.json();
      const cleanText = (data.answer || "").replace(/```(d3-json|quiz-json|assignment-prompt)[\s\S]*?```/g, "").trim();
      setMessages(prev => [...prev, { role: "assistant", text: cleanText || "Target objective analyzed. Proceeding to next step." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Communication blackout. Attempting to re-establish neural link..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminate = async () => {
    const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
    if (!user.id) {
        localStorage.removeItem('dsa_mentor_user');
        window.location.href = '/auth';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/terminate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
        });
        if (response.ok) {
            localStorage.removeItem('dsa_mentor_user');
            window.location.href = '/auth';
        }
    } catch (err) {
        console.error("Termination failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dsa_mentor_user');
    window.location.href = '/auth';
  };

  return (
    <div className="dashboard-grid bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
      {/* Dynamic Background Noise/Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none grid-bg" />

      {/* Custom Cursor */}
      <motion.div 
        className="custom-cursor hidden lg:flex"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: "spring", damping: 40, stiffness: 400, mass: 0.2 }}
      >
        <div className="w-1 h-1 bg-primary rounded-full" />
      </motion.div>
      <div className="cursor-dot hidden lg:block" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 90 }}
        className="bg-card border-r border-white/5 flex flex-col z-50 relative backdrop-blur-xl"
      >
        <div className="p-8 flex items-center gap-4 mb-10">
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "anticipate" }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Globe className="text-white w-7 h-7" />
          </motion.div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-2xl font-black tracking-tight leading-none italic">ALGO<span className="text-primary">CORE</span></h1>
              <p className="text-[9px] text-muted-foreground tracking-[0.4em] uppercase font-bold mt-1">Intelligence Layer v4.2</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`sidebar-link group ${activeMode === mode.id ? "active" : ""}`}
            >
              <mode.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeMode === mode.id ? "text-primary" : ""}`} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{mode.label}</span>}
              {isSidebarOpen && activeMode === mode.id && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-3">
           <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-primary text-sm font-bold"
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>LOGOUT</span>}
           </button>
        </div>
      </motion.aside>

      {/* Main Container */}
      <div className="flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-background/20 backdrop-blur-2xl z-40">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="w-full bg-white/[0.03] rounded-2xl flex items-center px-5 py-3 border border-white/5 focus-within:border-primary/50 focus-within:bg-white/[0.05] transition-all group">
              <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input type="text" placeholder="Access neural archives..." className="bg-transparent border-none outline-none px-4 text-sm w-full font-medium" />
            </div>
          </div>

          <div className="flex items-center gap-8 ml-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Active Sync</span>
              <span className="text-xs font-bold text-primary leading-none">{JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}').name || 'Student'}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              onClick={handleLogout}
              className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 relative group"
            >
              <div className="absolute inset-0 bg-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <LogOut className="text-secondary w-5 h-5 relative z-10" />
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-10 custom-scrollbar relative flex flex-col">
          <div className="scan-line" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="fixed bottom-10 right-10 w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40 z-50 text-white group"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          {isAiOpen ? <X size={32} /> : <Sparkles size={32} className="animate-pulse" />}
        </motion.button>

        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ x: 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              className="fixed top-32 bottom-32 right-10 w-[450px] glass-card z-[60] flex flex-col border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
              style={{ background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(40px)' }}
            >
               <div className="scan-line" />
               <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg italic tracking-tight uppercase">Neural <span className="text-primary">Assistant</span></h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Core Status: Optimal</p>
                    </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[90%] p-5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none font-bold shadow-lg shadow-primary/20' 
                        : 'bg-white/[0.03] border border-white/5 rounded-tl-none font-medium'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.03] p-4 rounded-2xl rounded-tl-none border border-white/5">
                        <div className="flex gap-1.5">
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
               </div>

               <div className="p-8 bg-white/[0.02] border-t border-white/5">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Input query for neural processing..." 
                      className="flex-1 bg-white/[0.05] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-primary/50 focus:bg-white/[0.08] outline-none transition-all font-bold"
                    />
                    <button type="submit" className="p-4 bg-primary rounded-2xl text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                      <Send size={20} />
                    </button>
                  </form>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
