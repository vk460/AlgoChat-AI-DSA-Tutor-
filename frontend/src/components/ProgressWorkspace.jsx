import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Trophy, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import API_URL from '../config';

export default function ProgressWorkspace() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`${API_URL}/api/progress/?user_id=${user.id || 1}`);
        const data = await response.json();
        if (data.progress) {
          setProgress(data.progress);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user.id]);

  const stats = [
    { label: "Total Assignments", value: progress.filter(p => p.type === 'assignment').length, icon: Calendar, color: "text-primary" },
    { label: "Avg. Score", value: progress.length > 0 ? (progress.reduce((acc, curr) => acc + curr.score, 0) / progress.length).toFixed(1) : 0, icon: TrendingUp, color: "text-success" },
    { label: "Quizzes Completed", value: progress.filter(p => p.type === 'quiz').length, icon: Trophy, color: "text-secondary" },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-2 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Learning Progress</h2>
          <p className="text-muted-foreground text-sm">Track your algorithms mastery and performance</p>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-primary">Last active: Recently</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Activity History</h3>
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {progress.length > 0 ? (
            progress.map((entry, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i}
                className="glass-panel p-4 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    entry.type === 'quiz' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                  }`}>
                    {entry.type === 'quiz' ? <Trophy size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{entry.topic}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{entry.type} • {new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold font-mono ${
                    entry.score >= 8 ? 'text-success' : entry.score >= 5 ? 'text-secondary' : 'text-destructive'
                  }`}>
                    {entry.score}/{entry.total_score}
                  </span>
                  {entry.feedback && (
                    <p className="text-[10px] text-muted-foreground max-w-[200px] truncate">{entry.feedback}</p>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
              <BarChart3 size={48} className="mb-4 opacity-20" />
              <p>No activity recorded yet.</p>
              <p className="text-xs">Complete quizzes and assignments to see your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
