import { useState, MouseEvent } from "react";
import { Search, CheckCircle, Trash2, Copy, FileText, Camera, Keyboard, AlertCircle, ArrowUpRight } from "lucide-react";
import { SolvedQuestion } from "../types";

interface HistoryListProps {
  history: SolvedQuestion[];
  onSelect: (solved: SolvedQuestion) => void;
  onDeleteOne: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({ history, onSelect, onDeleteOne, onClearAll }: HistoryListProps) {
  const [search, setSearch] = useState("");

  const filtered = history.filter((item) => {
    const qMatches = item.question?.toLowerCase().includes(search.toLowerCase());
    const valMatches = item.correctAnswer?.toLowerCase().includes(search.toLowerCase());
    const rMatches = item.reason?.toLowerCase().includes(search.toLowerCase());
    return qMatches || valMatches || rMatches;
  });

  const handleCopy = (e: MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    // Simple temporary display feedback isn't strictly necessary but helpful.
  };

  return (
    <div className="w-full flex flex-col space-y-4 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search header bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="FILTER HISTORICAL SOLVES..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/55 transition"
          />
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-3 py-2 bg-red-950/15 border border-red-900/40 text-[10px] text-red-400 rounded-lg hover:bg-red-900/35 transition flex items-center justify-center space-x-1.5 self-end sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>WIPE LOCAL MATRIX</span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-2xl border-gray-800 flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="w-10 h-10 mb-3 text-gray-600 animate-pulse" />
          <p className="text-xs uppercase tracking-widest font-bold">No Records Compiled</p>
          <p className="text-[10px] text-gray-600 mt-1 max-w-xs leading-relaxed">
            {search ? "No questions match your current search string." : "Scan a question using the live optical camera feeds or upload text files to populate history."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="glass-panel hover:bg-black/40 border border-gray-800 hover:border-neon-cyan p-4 rounded-xl transition duration-300 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              {/* Type tag icon background watermark */}
              <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                <span className="text-[8px] px-2 py-0.5 bg-black/80 border border-gray-800 rounded-full text-gray-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  item.confidenceStatus === "HIGH" 
                    ? "bg-neon-green/10 text-neon-green border-neon-green/30"
                    : "bg-red-950/20 text-red-500 border-red-500/20"
                }`}>
                  {item.confidence}%
                </span>
              </div>

              <div className="space-y-2 pr-12">
                {/* Meta Type info row */}
                <div className="flex items-center space-x-1.5 text-[9px] text-gray-400">
                  {item.sourceType === "camera" && <Camera className="w-3.5 h-3.5 text-neon-green" />}
                  {item.sourceType === "document" && <FileText className="w-3.5 h-3.5 text-cyber-blue" />}
                  {item.sourceType === "manual" && <Keyboard className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="uppercase tracking-wider font-bold">
                    {item.sourceType === "document" && item.fileName ? item.fileName : `${item.sourceType}_solve`}
                  </span>
                </div>

                {/* Question description */}
                <p className="text-xs text-neutral-300 font-mono line-clamp-2 leading-relaxed">
                  {item.question}
                </p>
              </div>

              {/* Bottom Resolved Section */}
              <div className="pt-2 border-t border-gray-800/65 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="text-neon-cyan font-bold">ANS:</span>{" "}
                  <span className="text-white bg-black/50 px-2 py-0.5 border border-neon-cyan/20 rounded font-black max-w-[120px] inline-block truncate vertical-middle">
                    {item.correctAnswer}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleCopy(e, item.correctAnswer)}
                    className="p-1.5 bg-gray-900/50 hover:bg-neon-cyan/15 text-gray-500 hover:text-neon-cyan rounded border border-gray-800 transition cursor-pointer"
                    title="Copy Answer Code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOne(item.id);
                    }}
                    className="p-1.5 bg-gray-900/50 hover:bg-red-500/15 text-gray-500 hover:text-red-500 rounded border border-gray-800 transition cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
