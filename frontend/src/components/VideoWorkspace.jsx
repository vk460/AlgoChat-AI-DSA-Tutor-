import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Link2, Clock, ArrowRight, BookOpen, Sparkles, Send, Bot, User, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function VideoWorkspace() {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("05:00");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "I'm ready to help you analyze this video! Paste a link and tell me which part is confusing." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setVideoData(null);

    try {
      const response = await fetch("http://localhost:8000/video/process/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (data.steps) {
        setVideoData(data);
        setChatMessages(prev => [...prev, { 
          role: "ai", 
          text: `I've analyzed the video! I've broken it down into ${data.steps.length} key steps. You can ask me specific questions about what's being explained.` 
        }]);
      } else {
        setChatMessages(prev => [...prev, { role: "ai", text: data.error || "I couldn't analyze this video. Please try another one." }]);
      }
    } catch (error) {
      console.error("Video analysis error:", error);
      setChatMessages(prev => [...prev, { role: "ai", text: "Backend connection failed. Is the server running?" }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !videoData?.video_id || isChatLoading) return;
    
    const userMsg = { role: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("http://localhost:8000/video/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          video_id: videoData.video_id,
          query: currentInput
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "ai", text: data.answer || "I'm not sure about that. Let's look at the concepts again." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "ai", text: "Sorry, my video-brain is offline right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full workspace-animation overflow-hidden">
      {/* Left: Video Input & Steps */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong glow-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Video Tutor</h2>
          </div>
          
          <div className="space-y-4">
            <div className="glass-panel flex items-center gap-2 px-3 py-2.5">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube Link..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>

            <Button 
              className="w-full gap-2" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !url}
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing Video..." : "Analyze Concepts"}
            </Button>
          </div>
        </motion.div>

        {videoData?.steps ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2">Conceptual Breakdown</h3>
            {videoData.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-5 space-y-3 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-sm bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {step.step || i + 1}
                    </div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                  </div>
                  <PlayCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.explanation}</p>
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-[11px] text-primary/80 font-bold uppercase mb-1">Self-check quest</p>
                  <p className="text-xs text-foreground italic">"{step.question}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-panel-strong border-dashed p-12 text-center flex-1 flex flex-col items-center justify-center opacity-70">
            <Video className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-foreground font-semibold">Ready to Teach</p>
            <p className="text-sm text-muted-foreground mt-1">Paste a tutorial link to start the analysis.</p>
          </div>
        )}
      </div>

      {/* Right: AI Brain Chat */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-panel-strong glow-border flex flex-col h-full min-h-0"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-border">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Video Brain</p>
              <p className="text-[10px] text-success flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active Analysis
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-primary/20 border border-primary/30 text-foreground" 
                    : "glass-panel text-foreground"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {msg.role === "ai" ? <Bot className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-secondary" />}
                    <span className="text-[9px] uppercase tracking-widest font-black opacity-50">
                      {msg.role === "ai" ? "Video Tutor" : "Student"}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {(msg.text || "")
                      .replace(/Explanation:\s*/i, "")
                      .replace(/Visual:\s*/i, "\n\n**Visualization:**\n")
                      .replace(/Question:\s*/i, "\n\n**Think about this:**\n")}
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="glass-panel p-3 rounded-2xl flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 glass-panel px-4 py-2.5">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={videoData ? "Ask about the video..." : "Analyze a video first"}
                className="bg-transparent border-none text-sm p-0 h-auto focus-visible:ring-0"
                disabled={!videoData || isChatLoading}
              />
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={!chatInput.trim() || !videoData || isChatLoading}
              className="rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
