import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Heart, Lightbulb, Star, Zap, Bot, User, Send, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API_URL from "../config";

const challenges = [
  { id: 1, title: "Bubble Sort Challenge", difficulty: "Easy", xp: 50, type: "sorting", goal: "Sort the array using adjacent swaps." },
  { id: 2, title: "Binary Search Quest", difficulty: "Medium", xp: 100, type: "searching", goal: "Find the target element in minimal steps." },
  { id: 3, title: "Tree Traversal", difficulty: "Hard", xp: 200, type: "trees", goal: "Visit all nodes in the correct order." },
];

export default function PracticeWorkspace() {
  const [selectedChallenge, setSelectedChallenge] = useState(1);
  const [blocks, setBlocks] = useState([7, 3, 9, 1, 5]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [score, setScore] = useState(120);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState(null);
  
  // AI Brain state
  const [isBrainOpen, setIsBrainOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "I'm your Practice Coach! Click 'Hint' if you get stuck, or ask me for a tip." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef(null);

  const activeChallenge = challenges.find(c => c.id === selectedChallenge);
  const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleBlockClick = (index) => {
    if (selectedBlock === null) {
      setSelectedBlock(index);
    } else {
      const newBlocks = [...blocks];
      [newBlocks[selectedBlock], newBlocks[index]] = [newBlocks[index], newBlocks[selectedBlock]];

      if (blocks[selectedBlock] > blocks[index] && Math.abs(selectedBlock - index) === 1) {
        setBlocks(newBlocks);
        setScore((s) => s + 10);
        setFeedback({ type: "success", message: "Correct swap! +10 XP" });
      } else {
        setLives((l) => Math.max(0, l - 1));
        setFeedback({ type: "error", message: "Not the right move. Adjacent elements only!" });
      }
      setSelectedBlock(null);
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const getHint = async () => {
    setIsChatLoading(true);
    setChatMessages(prev => [...prev, { role: "user", text: "I need a hint for this step." }]);
    
    try {
      const response = await fetch(`${API_URL}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `I'm playing the ${activeChallenge.title}. Current state: [${blocks.join(', ')}]. I need a Socratic hint. Don't give me the answer!`,
          session_id: "practice_session_" + (user.id || "guest"),
          user_id: user.id || 1
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "ai", text: data.answer || "Try thinking about which element is the largest." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "ai", text: "I'm having trouble thinking right now. Check your connection." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const currentInput = chatInput;
    setChatMessages(prev => [...prev, { role: "user", text: currentInput }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentInput,
          session_id: "practice_session_" + (user.id || "guest"),
          user_id: user.id || 1
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "ai", text: data.answer || "Keep going, you're doing great!" }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "ai", text: "Backend brain is currently unavailable." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full workspace-animation overflow-hidden">
      {/* Challenge List */}
      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Challenges
        </h3>
        {challenges.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedChallenge(c.id)}
            className={`w-full glass-panel p-4 text-left transition-all ${
              selectedChallenge === c.id ? "border-primary/30 glow-border" : "hover:border-primary/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${
                c.difficulty === "Easy" ? "text-success" : c.difficulty === "Medium" ? "text-primary" : "text-destructive"
              }`}>
                {c.difficulty}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3" /> {c.xp} XP
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{c.title}</p>
          </motion.button>
        ))}
      </div>

      <div className={`lg:col-span-${isBrainOpen ? "2" : "3"} flex flex-col gap-4 overflow-hidden`}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong flex items-center justify-between px-5 py-3"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-semibold text-foreground">{score}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${i < lives ? "text-destructive fill-destructive" : "text-muted"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={getHint}
              disabled={isChatLoading}
              className="flex items-center gap-1.5 glass-panel px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors hover:border-primary/30"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hint
            </button>
            <button 
              onClick={() => setIsBrainOpen(!isBrainOpen)}
              className={`flex items-center gap-1.5 glass-panel px-3 py-1.5 text-xs transition-colors ${isBrainOpen ? "text-primary border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Brain className="w-3.5 h-3.5" />
              {isBrainOpen ? "Hide Brain" : "AI Brain"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-panel-strong glow-border flex-1 p-8 grid-bg flex flex-col items-center justify-center relative min-h-[400px]"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">{activeChallenge.title}</h2>
            <p className="text-sm text-muted-foreground">{activeChallenge.goal}</p>
          </div>

          <div className="flex items-center gap-4 mb-12">
            {blocks.map((num, i) => (
              <motion.button
                key={`${i}-${num}`}
                layout
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBlockClick(i)}
                className={`node-block w-16 h-16 text-xl font-bold transition-all cursor-pointer ${
                  selectedBlock === i
                    ? "bg-primary/30 border-2 border-primary text-primary glow-border scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-muted/80 border-2 border-border hover:border-primary/40 text-foreground shadow-sm"
                }`}
              >
                {num}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`glass-panel px-5 py-3 text-sm font-medium ${
                  feedback.type === "success" ? "border-success/30 text-success" : "border-destructive/30 text-destructive"
                }`}
              >
                {feedback.type === "success" ? "✅" : "❌"} {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* AI Brain Panel */}
      <AnimatePresence>
        {isBrainOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col glass-panel-strong glow-border min-h-0 h-full"
          >
            <div className="p-4 border-b border-border/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">AI Coach</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Socratic Guidance</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-primary/10 border border-primary/20 text-foreground" 
                        : "glass-panel text-foreground"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1 opacity-50 font-black uppercase text-[8px] tracking-tighter">
                        {msg.role === "ai" ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                        {msg.role === "ai" ? "Coach" : "Student"}
                      </div>
                      <div className="whitespace-pre-wrap">
                        {(msg.text || "").replace(/```(d3-json|quiz-json|assignment-prompt)[\s\S]*?```/g, "")}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="glass-panel p-3 rounded-2xl flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask for a tip..."
                  className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary/40"
                  disabled={isChatLoading}
                />
                <Button size="icon" className="w-8 h-8" onClick={handleSendChat} disabled={!chatInput.trim() || isChatLoading}>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
