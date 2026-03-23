import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const SPEED_OPTIONS = [
  { label: "0.25x", ms: 2400 },
  { label: "0.5x",  ms: 1200 },
  { label: "1x",    ms: 600 },
  { label: "2x",    ms: 300 },
  { label: "4x",    ms: 150 },
];

export default function ControlPanel({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBack,
  onReset,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  stepDescription,
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-strong px-5 py-3 flex flex-col gap-3"
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: step info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono font-bold text-sm">
              {currentStep + 1}
            </span>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-muted-foreground font-mono text-xs">
              {totalSteps}
            </span>
          </div>
        </div>

        {/* Center: controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onStepBack}
            disabled={currentStep <= 0}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-30"
            title="Previous Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-destructive/20 border border-destructive/40 text-destructive"
                : "bg-primary/20 border border-primary/40 text-primary glow-border"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-30"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: speed buttons */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onSpeedChange(opt.ms)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                speed === opt.ms
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
