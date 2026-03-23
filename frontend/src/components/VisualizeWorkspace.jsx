import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Zap, Clock, HardDrive, Shield, Search, Keyboard } from "lucide-react";
import ArrayRenderer from "./visualizer/ArrayRenderer";
import StackRenderer from "./visualizer/StackRenderer";
import ControlPanel from "./visualizer/ControlPanel";
import StepExplainer from "./visualizer/StepExplainer";
import {
  generateAlgorithmData,
  generateLinearSearch,
  generateBinarySearch,
  randomArray,
  ALGORITHM_META,
} from "./visualizer/algorithmData";
import "./VisualizeWorkspace.css";

const ALGORITHM_IDS = [
  "linear_search",
  "binary_search",
  "bubble_sort",
  "merge_sort",
  "quick_sort",
  "stack",
];

export default function VisualizeWorkspace() {
  const [selectedAlgo, setSelectedAlgo] = useState("bubble_sort");
  const [algoData, setAlgoData] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const intervalRef = useRef(null);

  // Custom input
  const [arrayInput, setArrayInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const isSearch = selectedAlgo.includes("search");
  const isStack = selectedAlgo === "stack";

  const generate = useCallback(
    (algoId, customArr, customTarget) => {
      const id = algoId || selectedAlgo;
      const arr = customArr || randomArray(10, 60);
      if (id.includes("search") && customTarget !== undefined) {
        const fn = id === "linear_search" ? generateLinearSearch : generateBinarySearch;
        setAlgoData(fn(arr, customTarget));
      } else {
        setAlgoData(generateAlgorithmData(id, arr));
      }
      setStepIndex(0);
      setIsPlaying(false);
    },
    [selectedAlgo]
  );

  const handleCustomInput = () => {
    const parsed = arrayInput
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (parsed.length < 2) return;
    const target = isSearch ? parseInt(targetInput, 10) : undefined;
    generate(selectedAlgo, parsed, !isNaN(target) ? target : undefined);
  };

  useEffect(() => { generate(selectedAlgo); }, [selectedAlgo]);

  // Auto-play: when speech is ON, speech drives the stepping;
  //            when speech is OFF, use speed-based interval.
  useEffect(() => {
    if (isPlaying && algoData && !autoSpeak) {
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= algoData.steps.length - 1) {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, algoData, autoSpeak]);

  // When speech finishes a step and we're still playing, advance
  const handleSpeechDone = useCallback(() => {
    if (!isPlaying || !autoSpeak || !algoData) return;
    setStepIndex((prev) => {
      if (prev >= algoData.steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [isPlaying, autoSpeak, algoData]);

  const totalSteps = algoData?.steps?.length || 0;
  const currentStep = algoData?.steps?.[stepIndex];
  const meta = ALGORITHM_META[selectedAlgo] || {};

  return (
    <div className="viz-workspace">
      {/* Top: Algorithm tabs + Custom/Random */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="viz-top-bar glass-panel-strong"
      >
        <div className="viz-algo-tabs">
          {ALGORITHM_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedAlgo(id)}
              className={`viz-algo-tab ${selectedAlgo === id ? "active" : ""}`}
            >
              {ALGORITHM_META[id]?.label || id}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!isStack && (
            <button
              onClick={() => setShowInput((p) => !p)}
              className={`viz-input-toggle ${showInput ? "active" : ""}`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Custom</span>
            </button>
          )}
          <button onClick={() => generate(selectedAlgo)} className="viz-generate-btn">
            <Shuffle className="w-4 h-4" />
            <span>Random</span>
          </button>
        </div>
      </motion.div>

      {/* Custom Input Panel */}
      <AnimatePresence>
        {showInput && !isStack && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="viz-input-panel glass-panel"
          >
            <div className="viz-input-row">
              <div className="viz-input-field">
                <label>Array (comma or space separated)</label>
                <input
                  type="text"
                  value={arrayInput}
                  onChange={(e) => setArrayInput(e.target.value)}
                  placeholder="e.g. 4, 7, 2, 9, 5, 11, 56, 32"
                  className="viz-text-input"
                />
              </div>
              {isSearch && (
                <div className="viz-input-field viz-input-target">
                  <label>Target</label>
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="e.g. 56"
                    className="viz-text-input"
                  />
                </div>
              )}
              <button onClick={handleCustomInput} className="viz-run-btn">
                <Search className="w-4 h-4" />
                Visualize
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SPLIT LAYOUT: Visualization (left) + Explainer (right) ===== */}
      <div className="viz-split-layout">
        {/* LEFT: Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="viz-canvas glass-panel-strong glow-border grid-bg"
        >
          <div className="viz-canvas-header">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-bold">{meta.label}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{meta.desc}</p>
          </div>

          <div className="viz-canvas-inner">
            {algoData && !isStack && (
              <ArrayRenderer data={algoData} stepIndex={stepIndex} />
            )}
            {algoData && isStack && (
              <StackRenderer data={algoData} stepIndex={stepIndex} />
            )}
          </div>

          {/* Legend */}
          <div className="viz-legend">
            {isSearch ? (
              <>
                <LegendDot color="#f59e0b" label="Current" />
                <LegendDot color="#3b82f6" label="Midpoint" />
                <LegendDot color="#22c55e" label="Found" />
              </>
            ) : isStack ? (
              <>
                <LegendDot color="#22c55e" label="Push" />
                <LegendDot color="#ef4444" label="Pop" />
                <LegendDot color="#f59e0b" label="Peek" />
              </>
            ) : (
              <>
                <LegendDot color="#3b82f6" label="Comparing" />
                <LegendDot color="#f59e0b" label="Swapping" />
                <LegendDot color="#a855f7" label="Pivot" />
                <LegendDot color="#22c55e" label="Sorted" />
              </>
            )}
          </div>

          {/* Complexity info inside canvas */}
          <div className="viz-canvas-metrics">
            <InfoChip icon={<Clock className="w-3 h-3" />} label="TIME" value={meta.time} cls="text-primary" />
            <InfoChip icon={<HardDrive className="w-3 h-3" />} label="SPACE" value={meta.space} cls="text-accent" />
            <InfoChip icon={<Shield className="w-3 h-3" />} label="STABLE" value={meta.stable} cls="text-success" />
          </div>
        </motion.div>

        {/* RIGHT: Step Explainer */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="viz-explainer-panel glass-panel-strong"
        >
          <StepExplainer
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            algoLabel={meta.label}
            autoSpeak={autoSpeak}
            onToggleSpeak={() => setAutoSpeak((p) => !p)}
            onSpeechDone={handleSpeechDone}
          />
        </motion.div>
      </div>

      {/* Controls */}
      <ControlPanel
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onStepForward={() => setStepIndex((p) => Math.min(p + 1, totalSteps - 1))}
        onStepBack={() => setStepIndex((p) => Math.max(p - 1, 0))}
        onReset={() => { setStepIndex(0); setIsPlaying(false); window.speechSynthesis.cancel(); }}
        speed={speed}
        onSpeedChange={setSpeed}
        currentStep={stepIndex}
        totalSteps={totalSteps}
      />
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="viz-legend-item">
      <div className="viz-legend-dot" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
      <span>{label}</span>
    </div>
  );
}

function InfoChip({ icon, label, value, cls }) {
  return (
    <div className="viz-info-chip">
      <span className="viz-info-chip-label">{icon} {label}</span>
      <span className={`viz-info-chip-value ${cls}`}>{value}</span>
    </div>
  );
}
