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
import { DiagnosticModal } from "./DiagnosticModal";
import API_URL from "../config";

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
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState([]);
  const [diagnosticConcept, setDiagnosticConcept] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState(null); // original question before quiz
  const [pipeline, setPipeline] = useState(null); // progress pipeline steps
  const scrollRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('dsa_mentor_user') || '{}');
  
  // localStorage tracks quizzed concepts as a cache (backend DB is the real source of truth)
  const getQuizzedConcepts = () => JSON.parse(localStorage.getItem('quizzed_concepts') || '{}');
  const markConceptQuizzed = (concept) => {
    const existing = getQuizzedConcepts();
    existing[concept.toLowerCase().trim()] = true;
    localStorage.setItem('quizzed_concepts', JSON.stringify(existing));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const parseStructuredBlocks = (content, extraData = {}) => {
    // ── D3 Diagram Detection (3 patterns for different AI output styles) ───────
    let d3Data = null;

    // Pattern 1: explicit ```d3-json block
    const d3Match = content.match(/```d3-json\s+([\s\S]*?)```/);
    if (d3Match) {
      try { d3Data = JSON.parse(d3Match[1]); } catch (e) { console.error("D3 parse error (d3-json)", e); }
    }

    // Pattern 2: any ```json block containing an "algorithm" key
    if (!d3Data) {
      const allJsonBlocks = [...content.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)];
      for (const m of allJsonBlocks) {
        try {
          const parsed = JSON.parse(m[1].trim());
          if (parsed && parsed.algorithm) { d3Data = parsed; break; }
        } catch (_) {}
      }
    }

    // Pattern 3: [ARRAY_TRACE]...[/ARRAY_TRACE] inline tags
    if (!d3Data) {
      const traceMatch = content.match(/\[ARRAY_TRACE\]([\s\S]*?)\[\/ARRAY_TRACE\]/);
      if (traceMatch) {
        try { d3Data = JSON.parse(traceMatch[1].trim()); } catch (e) { console.error("D3 parse error (ARRAY_TRACE)", e); }
      }
    }

    if (d3Data) {
      console.log("  [UI] D3 diagram detected, algorithm:", d3Data.algorithm);
      setCurrentD3Data(d3Data);
    }

    // ── Assignment Prompt ──────────────────────────────────────────────────────
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
      const response = await fetch(`${API_URL}/api/ask/`, {
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
        parseStructuredBlocks(data.answer, data);

        // DIRECT quiz handling — backend is source of truth
        // If backend says show_quiz=True and quiz_data exists → ALWAYS open modal
        if (data.show_quiz && Array.isArray(data.quiz_data) && data.quiz_data.length > 0) {
          const concept = data.current_concept || '';
          console.log("  [UI] Opening Diagnostic Modal for:", concept, "(", data.quiz_data.length, "questions)");
          setPendingQuestion(userMsg.content);
          setDiagnosticConcept(concept);
          setDiagnosticQuestions(data.quiz_data);
          setIsDiagnosticOpen(true);
        }
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
      const response = await fetch(`${API_URL}/assignment/submit/`, {
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
      {/* Gated Diagnostic Modal - Centered Blocking Pop-up */}
      <AnimatePresence>
        {isDiagnosticOpen && diagnosticQuestions.length > 0 && (
          <DiagnosticModal 
            questions={diagnosticQuestions}
            concept={diagnosticConcept}
            onComplete={async (answers) => {
              // Mark concept as quizzed in localStorage (survives server restarts)
              markConceptQuizzed(diagnosticConcept);
              setIsDiagnosticOpen(false);
              setDiagnosticQuestions([]);

              // Start the progress pipeline
              const steps = [
                { id: 1, label: 'Quiz Completed', done: true },
                { id: 2, label: 'Saving to Memory', done: false },
                { id: 3, label: 'Analyzing Knowledge', done: false },
                { id: 4, label: 'Generating Answer', done: false },
              ];
              setPipeline(steps);

              // Simulate pipeline steps
              await new Promise(r => setTimeout(r, 800));
              setPipeline(p => p.map(s => s.id === 2 ? {...s, done: true} : s));
              await new Promise(r => setTimeout(r, 800));
              setPipeline(p => p.map(s => s.id === 3 ? {...s, done: true} : s));

              // Auto-answer original question
              if (pendingQuestion) {
                setIsTyping(true);
                try {
                  const res = await fetch(`${API_URL}/api/ask/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      query: pendingQuestion,
                      session_id: 'learn_session_' + (user.id || 'guest'),
                      user_id: user.id || 1
                    })
                  });
                  const data = await res.json();
                  setPipeline(p => p.map(s => s.id === 4 ? {...s, done: true} : s));
                  if (data.answer) {
                    setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: data.answer }]);
                    parseStructuredBlocks(data.answer, data);
                  }
                } catch(e) { console.error(e); }
                finally { setIsTyping(false); setPendingQuestion(null); }
              }

              // Clear pipeline after 3s
              setTimeout(() => setPipeline(null), 3000);
            }} 
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left — AI Tutor Chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card flex flex-col min-h-0 overflow-hidden shadow-2xl"
        >
          <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Socratic Tutor</p>
              <p className="text-[10px] text-success flex items-center gap-1 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Support
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
                      className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20 ml-auto"
                          : "glass-card rounded-tl-none border-white/5 shadow-xl"
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
                            .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-accent font-mono text-xs">$1</code>')
                            // Color tag rendering: !!yellow[text]!! !!red[text]!! !!green[text]!!
                            .replace(/!!yellow\[(.*?)\]!!/g, '<span class="text-yellow-400 font-bold">$1</span>')
                            .replace(/!!red\[(.*?)\]!!/g, '<span class="text-red-400 font-bold">$1</span>')
                            .replace(/!!green\[(.*?)\]!!/g, '<span class="text-green-400 font-bold">$1</span>')
                            .replace(/!!blue\[(.*?)\]!!/g, '<span class="text-blue-400 font-bold">$1</span>')
                            .replace(/!!orange\[(.*?)\]!!/g, '<span class="text-orange-400 font-bold">$1</span>');
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

          <div className="p-3 border-t border-border/40 flex gap-2 relative z-20">
            {isDiagnosticOpen && (
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-bold">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Complete the Neural Mapping quiz to continue...
              </div>
            )}
            {!isDiagnosticOpen && (
              <>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask anything about DSA..."
                  className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
                />
                <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </>
            )}
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
              {/* Progress Pipeline */}
              <AnimatePresence>
                {pipeline && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-card p-5 shadow-xl border-primary/20"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">⚡ Neural Processing Pipeline</p>
                    <div className="space-y-3">
                      {pipeline.map((step, idx) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500' : 'bg-muted/50 border border-white/10'}`}>
                            {step.done
                              ? <CheckCircle2 size={12} className="text-white" />
                              : <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                            }
                          </div>
                          <span className={`text-xs font-medium ${step.done ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                          {!step.done && idx === pipeline.findIndex(s => !s.done) && (
                            <div className="ml-auto flex gap-1">
                              {[0,1,2].map(i => (
                                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                  className="w-1 h-1 rounded-full bg-primary" />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Visualization */}
              {currentD3Data ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-6 h-[400px] shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-lg uppercase tracking-widest">{(currentD3Data.algorithm || "").replace('_', ' ')}</h3>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCurrentD3Data({...currentD3Data})} className="text-[10px] h-8 font-bold tracking-widest border-white/10 hover:border-primary/50">RESTART</Button>
                  </div>
                  <D3Visualizer data={currentD3Data} />
                </motion.div>
              ) : (
                <div className="glass-card p-12 text-center border-dashed border-white/5 bg-white/2">
                  <Eye className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground italic max-w-xs mx-auto">Ask the AI to explain a concept to trigger a high-performance D3 simulation here.</p>
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
