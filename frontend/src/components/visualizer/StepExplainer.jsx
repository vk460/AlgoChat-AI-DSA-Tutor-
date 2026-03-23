import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, BookOpen, Calculator, Zap } from "lucide-react";

/*
  StepExplainer — Right-panel educational explanation for the current step.
  Also handles Browser Speech Synthesis narration.

  Props:
    step          — current step object { action, description, calculation }
    stepIndex     — 0-based step index
    totalSteps    — total number of steps
    algoLabel     — algorithm display name
    autoSpeak     — whether to auto-narrate
    onToggleSpeak — callback to toggle auto-narrate
    onSpeechDone  — called when narration finishes for a step
*/
export default function StepExplainer({
  step,
  stepIndex,
  totalSteps,
  algoLabel,
  autoSpeak,
  onToggleSpeak,
  onSpeechDone,
}) {
  const utterRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Convert technical text to natural speech
  function toSpeechText(text) {
    if (!text) return "";
    return text
      // arr[3] → "array at index 3"
      .replace(/arr\[(\d+)\]/g, "array at index $1")
      // array[3] → "array at index 3"
      .replace(/array\[(\d+)\]/g, "array at index $1")
      // stack[2] → "stack at index 2"
      .replace(/stack\[(\d+)\]/g, "stack at index $1")
      // left[0] → "left at index 0"
      .replace(/left\[(\d+)\]/g, "left at index $1")
      // right[0] → "right at index 0"
      .replace(/right\[(\d+)\]/g, "right at index $1")
      // a[0] → "a at index 0"
      .replace(/\ba\[(\d+)\]/g, "a at index $1")
      // == → "equals"
      .replace(/==/g, " equals ")
      // ≠ → "is not equal to"
      .replace(/≠/g, " is not equal to ")
      // ≤ → "is less than or equal to"
      .replace(/≤/g, " is less than or equal to ")
      // ≥ → "is greater than or equal to"
      .replace(/≥/g, " is greater than or equal to ")
      // → → "then"
      .replace(/→/g, ", then ")
      // ↔ → "and"
      .replace(/↔/g, " and ")
      // ✓ → ""
      .replace(/[✓✅❌🔍👉🎯🔄📌✂️🔗📥⬆️⬇️👁️]/gu, "")
      // floor( → "floor of"
      .replace(/floor\(/g, "floor of ")
      // Remove extra parentheses for speech
      .replace(/\)/g, " ")
      // "// 2" → "integer divided by 2"
      .replace(/\/\/ (\d+)/g, "integer divided by $1")
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim();
  }

  // Speak the current step description on every step change
  useEffect(() => {
    if (!autoSpeak || !step?.description) return;
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    // Small delay to let cancel take effect
    const timer = setTimeout(() => {
      const text = `Step ${stepIndex + 1}. ${toSpeechText(step.description)}`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.lang = "en-US";
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => {
        setIsSpeaking(false);
        // Notify parent that speech finished so it can advance
        if (onSpeechDone) onSpeechDone();
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        if (onSpeechDone) onSpeechDone();
      };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [stepIndex, autoSpeak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (!step) {
    return (
      <div className="step-explainer-empty">
        <BookOpen className="w-8 h-8 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground text-sm mt-2">
          Press Play or Step Forward to begin
        </p>
      </div>
    );
  }

  const actionLabel = (step.action || step.type || "").replace(/_/g, " ").toUpperCase();

  return (
    <div className="step-explainer">
      {/* Header */}
      <div className="step-explainer-header">
        <div className="step-explainer-title">
          <span className="step-number">Step {stepIndex + 1}</span>
          <span className="step-total">/ {totalSteps}</span>
        </div>
        <button
          onClick={onToggleSpeak}
          className={`step-speak-btn ${autoSpeak ? "active" : ""}`}
          title={autoSpeak ? "Turn off audio narration" : "Turn on audio narration"}
        >
          {autoSpeak ? (
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span>{autoSpeak ? "Narrating" : "Audio Off"}</span>
        </button>
      </div>

      {/* Action badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`action-${stepIndex}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="step-action-badge"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </motion.div>
      </AnimatePresence>

      {/* Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`desc-${stepIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="step-section"
        >
          <div className="step-section-label">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explanation</span>
          </div>
          <p className="step-description">{step.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Calculation */}
      {step.calculation && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`calc-${stepIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="step-section"
          >
            <div className="step-section-label">
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculation</span>
            </div>
            <pre className="step-calculation">{step.calculation}</pre>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
