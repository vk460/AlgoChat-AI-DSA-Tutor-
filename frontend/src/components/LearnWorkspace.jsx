import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Send, Bot, User, 
  BarChart3, Lightbulb, CheckCircle2, XCircle,
  Clock, Zap, FileText, Award, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import D3Visualizer from "./D3Visualizer";

export default function LearnWorkspace() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      content:
        "👋 Welcome back! I'm your AI tutor. We're ready to dive into **Data Structures and Algorithms**.\n\nAsk me about a topic like Binary Search, Stack, or Merge Sort to start our interactive session!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [currentD3Data, setCurrentD3Data] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [assignmentPrompt, setAssignmentPrompt] = useState(null);
  const [assignmentText, setAssignmentText] = useState("");
  const [assignmentFeedback, setAssignmentFeedback] = useState(null);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const scrollRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const parseStructuredBlocks = (content) => {
    const d3Match = content.match(/```d3-json\s+([\s\S]*?)```/);
    if (d3Match) {
      try {
        setCurrentD3Data(JSON.parse(d3Match[1]));
      } catch (e) { console.error("D3 JSON Parse Error", e); }
    }

    const quizMatch = content.match(/```quiz-json\s+([\s\S]*?)```/);
    if (quizMatch) {
      try {
        setCurrentQuiz(JSON.parse(quizMatch[1]));
        setQuizSubmitted(false);
        setQuizAnswers({});
      } catch (e) { console.error("Quiz JSON Parse Error", e); }
    }

    const assignmentMatch = content.match(/```assignment-prompt\s+([\s\S]*?)```/);
    if (assignmentMatch) {
      setAssignmentPrompt(assignmentMatch[1].replace(/"/g, ''));
      setAssignmentFeedback(null);
      setAssignmentText("");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg = { id: Date.now(), role: "user", content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg.content,
          session_id: "learn_session_" + (user.id || "guest"),
          user_id: user.id || 1
        })
      });
      const data = await response.json();
      if (data.answer) {
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", content: data.answer }]);
        parseStructuredBlocks(data.answer);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", content: "I'm having trouble connecting to my brain right now. Please check if the backend is running." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentText.trim()) return;
    setIsSubmittingAssignment(true);
    try {
      const response = await fetch("http://localhost:8000/assignment/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id || 1,
          topic: currentD3Data?.algorithm || "General DSA",
          submission_text: assignmentText
        })
      });
      const data = await response.json();
      setAssignmentFeedback(data);
    } catch (error) {
      console.error("Assignment Error:", error);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const score = quizSubmitted && currentQuiz
    ? currentQuiz.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correct ? 1 : 0), 0)
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full workspace-animation">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left — AI Tutor Chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel-strong glow-border flex flex-col min-h-0"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border/40">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Tutor</p>
              <p className="text-[10px] text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Online
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary/20 text-foreground border border-primary/30"
                          : "glass-panel text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.role === "ai" ? (
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-accent" />
                        )}
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {msg.role === "ai" ? "AI Tutor" : "You"}
                        </span>
                      </div>
                      {(msg.content || "")
                        .replace(/```(d3-json|quiz-json|assignment-prompt)[\s\S]*?```/g, "") // Hide JSON blocks
                        .split("\n").map((line, i) => {
                          let processed = (line || "")
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="text-muted-foreground">$1</em>')
                            .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-accent font-mono text-xs">$1</code>');
                          return (
                            <span key={i}>
                              <span dangerouslySetInnerHTML={{ __html: processed }} />
                              {i < (msg.content || "").split("\n").length - 1 && <br />}
                            </span>
                          );
                        })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border/40 flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about DSA..."
              className="bg-muted/50 border-border/50 text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Right — Interactive Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col min-h-0 overflow-hidden"
        >
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4 pb-12">
              {/* Dynamic Visualization */}
              {currentD3Data ? (
                <div className="glass-panel-strong glow-border p-4 h-[350px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h3 className="font-display font-bold text-lg uppercase tracking-wider">{(currentD3Data.algorithm || "").replace('_', ' ')}</h3>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCurrentD3Data({...currentD3Data})} className="text-[10px] h-7">RESTART</Button>
                  </div>
                  <D3Visualizer data={currentD3Data} />
                </div>
              ) : (
                <div className="glass-panel p-8 text-center border-dashed">
                  <Eye className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground italic">Ask the AI to explain a concept to see a live visualization here.</p>
                </div>
              )}

              {/* Dynamic Quiz */}
              {currentQuiz && (
                <div className="glass-panel-strong glow-border-purple p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    <h3 className="font-display text-lg font-bold text-foreground">Knowledge Check</h3>
                  </div>
                  <div className="space-y-4">
                    {currentQuiz.map((q, qi) => (
                      <div key={qi} className="glass-panel p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">{q.question}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, oi) => {
                            const selected = quizAnswers[qi] === oi;
                            const isCorrect = quizSubmitted && oi === q.correct;
                            const isWrong = quizSubmitted && selected && oi !== q.correct;
                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                disabled={quizSubmitted}
                                className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                                  isCorrect ? "border-success/50 bg-success/10 text-success" :
                                  isWrong ? "border-destructive/50 bg-destructive/10 text-destructive" :
                                  selected ? "border-primary/50 bg-primary/10 text-primary" :
                                  "border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/30"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!quizSubmitted ? (
                    <Button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < currentQuiz.length}
                      className="w-full"
                    >
                      Check Answers
                    </Button>
                  ) : (
                    <div className="p-4 rounded-xl text-center bg-secondary/10 border border-secondary/30">
                      <p className="font-display text-xl font-bold text-foreground">{score}/{currentQuiz.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Excellent! Keep going.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assignment Submission */}
              {assignmentPrompt && (
                <div className="glass-panel-strong glow-border p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <h3 className="font-display text-lg font-bold text-foreground">Assignment</h3>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-sm text-foreground italic">{assignmentPrompt}</p>
                  </div>
                  
                  {!assignmentFeedback ? (
                    <div className="space-y-3">
                      <textarea
                        value={assignmentText}
                        onChange={(e) => setAssignmentText(e.target.value)}
                        placeholder="Type your explanation or implementation logic here..."
                        className="w-full h-32 bg-muted/50 border border-border/50 rounded-xl p-4 text-sm outline-none focus:border-primary/50 transition-all resize-none"
                      />
                      <Button 
                        onClick={handleAssignmentSubmit} 
                        disabled={!assignmentText.trim() || isSubmittingAssignment}
                        className="w-full gap-2"
                      >
                        {isSubmittingAssignment ? "Analyzing..." : "Submit for Evaluation"}
                        <Send size={14} />
                      </Button>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-xl">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Score</p>
                          <p className="text-3xl font-display font-black text-primary">{assignmentFeedback.score}/10</p>
                        </div>
                        <div className="text-right">
                          <CheckCircle2 className="w-8 h-8 text-success ml-auto mb-1" />
                          <p className="text-xs font-bold text-foreground">Completed</p>
                        </div>
                      </div>
                      <div className="p-4 glass-panel space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Feedback</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{assignmentFeedback.feedback}</p>
                      </div>
                      {assignmentFeedback.weak_concepts?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {assignmentFeedback.weak_concepts.map(c => (
                            <span key={c} className="text-[9px] px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase">{c}</span>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" className="w-full text-xs" onClick={() => setAssignmentFeedback(null)}>TRY AGAIN</Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Default Content if nothing active */}
              {!currentD3Data && !currentQuiz && !assignmentPrompt && (
                <div className="space-y-4">
                  <div className="glass-panel p-6">
                    <h3 className="font-display font-bold mb-2">Welcome to interactive learning!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      As you chat with the AI tutor, it will generate visualizations and quizzes here specifically for your current topic.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 border-primary/20 bg-primary/5">
                      <Zap className="w-5 h-5 text-primary mb-2" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Visual Study</p>
                      <p className="text-xs text-foreground mt-1">Real-time animations</p>
                    </div>
                    <div className="glass-panel p-4 border-secondary/20 bg-secondary/5">
                      <Award className="w-5 h-5 text-secondary mb-2" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Self-Check</p>
                      <p className="text-xs text-foreground mt-1">Dynamic assessments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
}
