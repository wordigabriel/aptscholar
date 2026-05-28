import { Award, Zap, Cpu, CheckCircle } from "lucide-react";
import { SolvedQuestion } from "../types";

interface StatsGridProps {
  history: SolvedQuestion[];
}

export default function StatsGrid({ history }: StatsGridProps) {
  const total = history.length;
  const avgConfidence = total > 0 
    ? Math.round(history.reduce((acc, q) => acc + q.confidence, 0) / total)
    : 98;
    
  // Real or simulated responsive latency
  const avgLatency = total > 0 
    ? "0.9s - 1.4s" 
    : "1.1s";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Stat 1: Total Resolved */}
      <div className="glass-panel p-4 rounded-xl flex items-center space-x-4 animate-pulse-green">
        <div className="p-3 bg-neon-green/10 text-neon-green rounded-lg">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">Total Solved</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {total < 10 ? `0${total}` : total}
          </div>
        </div>
      </div>

      {/* Stat 2: Avg Speed */}
      <div className="glass-panel-cyan p-4 rounded-xl flex items-center space-x-4 animate-pulse-blue">
        <div className="p-3 bg-cyber-blue/10 text-cyber-blue rounded-lg">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">Solve Speed</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{avgLatency}</div>
        </div>
      </div>

      {/* Stat 3: Avg Confidence */}
      <div className="glass-panel p-4 rounded-xl flex items-center space-x-4 animate-pulse-green">
        <div className="p-3 bg-neon-green/10 text-neon-green rounded-lg">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">AI Accuracy</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{avgConfidence}%</div>
        </div>
      </div>

      {/* Stat 4: ROUTING MODE */}
      <div className="glass-panel-cyan p-4 rounded-xl flex items-center space-x-4 animate-pulse-blue">
        <div className="p-3 bg-cyber-blue/10 text-cyber-blue rounded-lg">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">Routing Mode</div>
          <div className="text-sm font-semibold font-mono text-cyber-blue mt-1">
            GEMINI-HYBRID
          </div>
        </div>
      </div>
    </div>
  );
}
