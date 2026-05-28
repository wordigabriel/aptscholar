import { useState, useEffect } from "react";
import {
  Camera,
  FileText,
  Clock,
  Settings,
  X,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Command,
  PlusCircle,
  History,
  Info,
  Sliders,
  Database,
  Grid
} from "lucide-react";
import StatsGrid from "./components/StatsGrid";
import Scanner from "./components/Scanner";
import DocUploader from "./components/DocUploader";
import HistoryList from "./components/HistoryList";
import AppLogo from "./components/AppLogo";
import { SolvedQuestion, ViewState } from "./types";

export default function App() {
  // Navigation View Controller
  const [view, setView] = useState<ViewState>("splash");
  
  // Storage hooks for Solved Quizzes
  const [history, setHistory] = useState<SolvedQuestion[]>([]);
  const [activeSolved, setActiveSolved] = useState<SolvedQuestion | null>(null);
  
  // Camera trigger and manual states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Stats states
  const [utcTime, setUtcTime] = useState("");

  // Copy status tooltip trigger
  const [copyAck, setCopyAck] = useState(false);

  // Speed and AI calibration settings
  const [speedMode, setSpeedMode] = useState<"instant" | "cross-check">("instant");
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aptscholar_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage history load failed:", e);
    }
  }, []);

  // Update UTC clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save resolved items to history list
  const saveToHistory = (solved: SolvedQuestion | SolvedQuestion[]) => {
    const newItems = Array.isArray(solved) ? solved : [solved];
    const updated = [...newItems, ...history];
    setHistory(updated);
    try {
      localStorage.setItem("aptscholar_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage save failed:", e);
    }
    if (newItems.length > 0) {
      setActiveSolved(newItems[0]);
    }
  };

  const deleteOneSolved = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("aptscholar_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage delete item failed:", e);
    }
    if (activeSolved && activeSolved.id === id) {
      setActiveSolved(null);
    }
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to wipe all scanned quiz questions from local machine? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem("aptscholar_history");
      setActiveSolved(null);
    }
  };

  // Perform Manual Text Resolve
  const solveManualText = async () => {
    if (!manualText.trim() || manualLoading) return;

    try {
      setManualLoading(true);
      setManualError(null);

      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: manualText
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to solve the manual question query.");
      }

      const questionsArray = resData.data.questions || [];
      if (questionsArray.length === 0) {
        throw new Error("No objective questions could be detected in raw text.");
      }

      const gId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const solutions: SolvedQuestion[] = questionsArray.map((q: any) => ({
        id: crypto.randomUUID(),
        questionNumber: q.questionNumber || 1,
        groupId: gId,
        groupTitle: `Manual terminal entry (${questionsArray.length} questions solved)`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        reason: q.reason,
        confidence: q.confidence || 95,
        confidenceStatus: q.confidenceStatus || "HIGH",
        timestamp,
        sourceType: "manual"
      }));

      saveToHistory(solutions);
      setManualText(""); // Clear query input box
    } catch (err: any) {
      console.error(err);
      setManualError(err.message || "Something went wrong solving manually.");
    } finally {
      setManualLoading(false);
    }
  };

  // Pre-load a few mock queries to let users test drive immediately
  const handleLoadMock = (index: number) => {
    const mocks = [
      "Which cell structure contains chlorophyll and absorbs sunlight for photosynthesis?\nA) Mitochondria\nB) Lysosome\nC) Chloroplast\nD) Ribosome",
      "True or False: The atomic number represents the number of protons inside an atomic nucleus.",
      "Solve the equation for x: 3x + 15 = 45.\n1. x = 5\n2. x = 10\n3. x = 15\n4. x = 20"
    ];
    setManualText(mocks[index]);
  };

  const triggerCopyAnswer = (ans: string) => {
    navigator.clipboard.writeText(ans);
    setCopyAck(true);
    setTimeout(() => setCopyAck(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between selection:bg-neon-green selection:text-black">
      
      {/* BACKGROUND GRAPHIC DETAILS (Sci-Fi mesh design) */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(57,255,20,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(57,255,20,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
      <div className="fixed top-12 left-10 w-[500px] h-[500px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-24 right-10 w-[400px] h-[400px] bg-cyber-blue/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* VIEWPORT CONTROLLER */}
      {view === "splash" ? (
        /* ==================== SPLASH SCREEN PORTAL ==================== */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">
          <div className="relative mb-6">
            <AppLogo variant="icon" size="xl" showText={false} className="animate-pulse-green" />
            <div className="absolute inset-x-0 -bottom-2 -top-2 border-2 border-dashed border-neon-green/30 rounded-3xl animate-spin [animation-duration:25s] pointer-events-none scale-110"></div>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-gray-200 uppercase">
            APT<span className="text-neon-green font-mono">Scholar</span>
          </h1>

          <div className="h-0.5 w-24 bg-neon-green/60 my-4 shadow-[0_0_10px_#39ff14]"></div>

          <p className="text-gray-400 font-mono text-[10px] md:text-xs tracking-widest uppercase max-w-md mx-auto leading-relaxed">
            [ ULTRA-FAST OPTICAL EXAMINATION SOLVER ]<br />
            SOLVES MCQ / OBJECTIVES / TRUE-FALSE INSTANTLY
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs justify-center font-mono">
            <button
              onClick={() => setView("dashboard")}
              className="glow-btn-green px-8 py-3.5 bg-neon-green text-black font-bold uppercase rounded-xl text-xs tracking-widest transition cursor-pointer"
            >
              INITIALIZE TERMINAL
            </button>
          </div>

          {/* System stats clock footer */}
          <div className="absolute bottom-6 font-mono text-[10px] text-gray-500 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-neon-green animate-pulse" />
            <span>SYS_TIME: {utcTime} | ENGINE: v3.5-FLASH</span>
          </div>
        </div>
      ) : (
        /* ==================== PRIMARY INTERACTION DASHBOARD ==================== */
        <>
          {/* Header Bar */}
          <header className="sticky top-0 z-40 bg-black/85 border-b border-gray-900/80 backdrop-blur-md px-4 py-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("splash")}>
              <AppLogo variant="icon" size="sm" showText={false} />
              <div>
                <span className="font-display font-black text-white hover:text-neon-green transition text-base tracking-tight uppercase">
                  APTS<span className="text-neon-green">Scholar</span>
                </span>
                <span className="text-[8px] text-gray-500 ml-2 uppercase font-mono tracking-wider hidden sm:inline-block font-bold">
                  STUDY SMART [v1.4]
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1.5 md:space-x-3 font-mono text-xs">
              <button
                onClick={() => setView("dashboard")}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
                  view === "dashboard"
                    ? "bg-neon-green/5 border-neon-green/30 text-neon-green"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DASHBOARD</span>
              </button>

              <button
                onClick={() => setView("history")}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
                  view === "history"
                    ? "bg-cyber-blue/5 border-cyber-blue/30 text-cyber-blue"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">HISTORY</span>
                {history.length > 0 && (
                  <span className="bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40 font-bold px-1.5 py-0.2 text-[9px] rounded-full">
                    {history.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setView("settings")}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 ${
                  view === "settings"
                    ? "bg-gray-800 border-gray-750 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CALIBRATION</span>
              </button>
            </nav>
          </header>

          {/* Main Workspace Frame container */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-10 z-10 flex flex-col space-y-6 md:space-y-8">
            
            {/* View Grid Switcher */}
            {view === "dashboard" && (
              <>
                {/* 1. Neon Statistics Modules */}
                <StatsGrid history={history} />

                {/* 2. Primary Scan Launchpad */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column - Fast Launch & Drop Document */}
                  <div className="md:col-span-6 flex flex-col space-y-6">
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col space-y-4 shadow-[0_0_40px_rgba(57,255,20,0.03)] border-neon-green/10">
                      
                      <div className="flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-neon-green" />
                        <h2 className="font-display font-medium text-white text-sm tracking-wider uppercase">
                          OPTICAL CAMERA SENSOR
                        </h2>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono">
                        Supports continuous scanning from computer monitors, projectors, mobile screens, and printed textbooks. Matches formatting instantly.
                      </p>

                      {/* Giant Camera Trigger Button */}
                      <button
                        onClick={() => {
                          setScannerOpen(true);
                        }}
                        className="glow-btn-green w-full py-5 bg-neon-green hover:bg-neon-green/90 text-black font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center space-x-3 cursor-pointer shadow-md transition-all duration-300"
                      >
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                        <span>OPEN LIVE OPTICAL SCANNER</span>
                      </button>

                      {/* Continuous Mode Indicator watermark label */}
                      <div className="border-t border-gray-900 pt-3 flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>DETECTION RANGE: 1.2M</span>
                        <span className="text-neon-green">AUTO EDGE CALIBRATING</span>
                      </div>
                    </div>

                    {/* Document Upload Area */}
                    <div className="glass-panel-cyan p-6 rounded-2xl flex flex-col space-y-4 border-cyber-blue/10">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-cyber-blue" />
                        <h2 className="font-display font-medium text-white text-sm tracking-wider uppercase">
                          BATCH PDF / DOCUMENT LOADER
                        </h2>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono">
                        Direct text extraction pipeline from local PDF examination files and Word booklets.
                      </p>

                      {/* Local Dropzone Module */}
                      <DocUploader
                        onSolved={(newSolution) => {
                          saveToHistory(newSolution);
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column - Manual Text Terminal Solve */}
                  <div className="md:col-span-6">
                    <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-4 border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] h-full justify-between">
                      <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-900">
                          <div className="flex items-center space-x-2">
                            <Sliders className="w-5 h-5 text-amber-500" />
                            <h2 className="font-display font-medium text-white text-sm tracking-widest uppercase">
                              MANUAL RESOLUTION TERMINAL
                            </h2>
                          </div>
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded font-mono">
                            INPUT_READY
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 font-mono leading-relaxed">
                          Paste text questions from test screens or copy-paste portals directly.
                        </p>

                        <div className="relative">
                          <textarea
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            placeholder="PASTE MCQ OR SIMPLIFIED QUIZ QUESTION HERE..."
                            rows={6}
                            className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-xs font-mono text-neutral-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none transition"
                          />
                        </div>

                        {/* Fast test-drive recommendations */}
                        <div className="flex flex-col space-y-2">
                          <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                            Instant Test Launchers:
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleLoadMock(0)}
                              className="px-2 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded text-[9px] font-mono text-gray-400 hover:text-white transition truncate cursor-pointer text-left"
                            >
                              🚀 Biology MCQ
                            </button>
                            <button
                              onClick={() => handleLoadMock(1)}
                              className="px-2 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded text-[9px] font-mono text-gray-400 hover:text-white transition truncate cursor-pointer text-left"
                            >
                              🧪 Chemistry T/F
                            </button>
                            <button
                              onClick={() => handleLoadMock(2)}
                              className="px-2 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded text-[9px] font-mono text-gray-400 hover:text-white transition truncate cursor-pointer text-left"
                            >
                              📐 Math MCQ
                            </button>
                          </div>
                        </div>

                        {manualError && (
                          <p className="text-[10px] text-red-500 font-mono border border-red-950/40 bg-red-950/15 p-2 rounded">
                            ERROR: {manualError}
                          </p>
                        )}
                      </div>

                      {/* Solve trigger */}
                      <button
                        onClick={solveManualText}
                        disabled={!manualText.trim() || manualLoading}
                        className="glow-btn-cyan w-full py-3.5 bg-neutral-900 border border-amber-500/60 hover:bg-amber-500/10 text-amber-500 font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                      >
                        {manualLoading ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-t-amber-500 border-r-transparent animate-spin"></div>
                            <span>CALCULATING CORRECT TARGET...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>SOLVE AT MILLISECOND LATENCY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* View History controller */}
            {view === "history" && (
              <div className="flex flex-col space-y-4">
                <div className="pb-3 border-b border-gray-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-cyber-blue" />
                    <h2 className="font-display font-medium text-white tracking-widest uppercase">
                      LOCAL KNOWLEDGE COMPLIANCE DATABASE
                    </h2>
                  </div>
                  <span className="text-[9px] bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue px-2.5 py-0.5 rounded font-mono">
                    {history.length} SOLVES STORED
                  </span>
                </div>

                <HistoryList
                  history={history}
                  onSelect={(solved) => setActiveSolved(solved)}
                  onDeleteOne={deleteOneSolved}
                  onClearAll={clearAllHistory}
                />
              </div>
            )}

            {/* View Calibration settings controller */}
            {view === "settings" && (
              <div className="mx-auto max-w-xl w-full glass-panel p-6 rounded-2xl flex flex-col space-y-6 border-gray-800">
                <div className="pb-3 border-b border-gray-900 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-300 animate-spin [animation-duration:10s]" />
                  <h2 className="font-display font-medium text-white tracking-widest uppercase text-sm">
                    SOLVER ENGINE CALIBRATION
                  </h2>
                </div>

                {/* Calibration param 1: speed mode */}
                <div className="space-y-2 font-mono text-xs">
                  <label className="text-gray-400 uppercase tracking-widest text-[10px] font-bold block">
                    PROCESSING PRESETS
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSpeedMode("instant")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition ${
                        speedMode === "instant"
                          ? "bg-neon-green/10 border-neon-green text-neon-green"
                          : "border-gray-800 bg-black/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold uppercase text-[10px]">FAST FLASH (DEFAULT)</span>
                      <span className="text-[9px] text-gray-500 leading-relaxed">
                        Optimized prompt speed, runs in &lt;1.5s maximum output bounds.
                      </span>
                    </button>

                    <button
                      onClick={() => setSpeedMode("cross-check")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition ${
                        speedMode === "cross-check"
                          ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue"
                          : "border-gray-800 bg-black/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold uppercase text-[10px]">DEEP CROSS-CHECK</span>
                      <span className="text-[9px] text-gray-500 leading-relaxed">
                        Heuristic response verification with multiple model checkpoints.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Calibration param 2: confidence slider */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <label className="uppercase tracking-widest text-[10px] font-bold">
                      LOW CONFIDENCE THRESHOLD
                    </label>
                    <span className="text-neon-cyan font-bold">{confidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                    className="w-full accent-neon-cyan bg-gray-800 rounded-lg cursor-pointer opacity-80 hover:opacity-100"
                  />
                  <div className="flex justify-between text-[8px] text-gray-500 leading-relaxed">
                    <span>50% (Loose)</span>
                    <span>70% (Standard Benchmark)</span>
                    <span>95% (Extreme Accuracy)</span>
                  </div>
                </div>

                {/* Calibration facts */}
                <div className="p-3 bg-neon-green/5 border border-neon-green/15 rounded-xl flex items-start space-x-2.5 text-gray-400 text-[10px] font-mono leading-relaxed">
                  <Info className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white uppercase">SYSTEM ROUTING FACT:</span> Any resolved query via camera or batch loaders automatically maps to <strong className="text-white font-mono">gemini-3.5-flash</strong>, keeping execution server-side, securing API keys, and meeting constraints safely.
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* ==================== ACTIVE SOLUTION TERMINAL (HUD PANEL) ==================== */}
      {activeSolved && (() => {
        const groupQuestions = activeSolved.groupId
          ? history.filter((q) => q.groupId === activeSolved.groupId)
          : [activeSolved];
        
        // Sort sequentially by questionNumber
        groupQuestions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

        const isMulti = groupQuestions.length > 1;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-black border-2 border-neon-green rounded-2xl relative shadow-[0_0_50px_rgba(57,255,20,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Overlay grid grid line header */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent"></div>
              
              {/* Header bar */}
              <div className="px-6 py-4 border-b border-gray-950 flex items-center justify-between bg-zinc-950/60 font-mono">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-ping"></span>
                  <span className="text-[10px] text-neon-green font-bold tracking-widest uppercase">
                    {isMulti
                      ? `BATCH DECODING STREAM: ${groupQuestions.length} QUESTIONS SOLVED`
                      : "QUIZ SOLUTION STREAM SUCCESS"}
                  </span>
                </div>
                <button
                  onClick={() => setActiveSolved(null)}
                  className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-Question Selection Strip */}
              {isMulti && (
                <div className="px-6 py-3 border-b border-gray-950 bg-black/40 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold">
                      Detected Batch Map ({groupQuestions.length} Questions)
                    </div>
                    <button
                      onClick={() => {
                        const formatted = groupQuestions
                          .map((q) => `Q${q.questionNumber || 1}: ${q.correctAnswer}`)
                          .join("\n");
                        navigator.clipboard.writeText(formatted);
                        setCopyAck(true);
                        setTimeout(() => setCopyAck(false), 2000);
                      }}
                      className="text-[9px] bg-cyber-blue/10 border border-cyber-blue/45 text-cyber-blue hover:bg-cyber-blue hover:text-black hover:font-bold px-3 py-1 rounded transition-all cursor-pointer font-mono"
                    >
                      {copyAck ? "COPIED ALL KEY ANSWERS!" : "COPY ALL KEY ANSWERS"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {groupQuestions.map((q) => {
                      const isSelected = q.id === activeSolved.id;
                      const isHighConfidence = q.confidenceStatus === "HIGH";
                      return (
                        <button
                          key={q.id}
                          onClick={() => setActiveSolved(q)}
                          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all border flex items-center space-x-1 cursor-pointer ${
                            isSelected
                              ? "bg-neon-green text-black font-black border-neon-green scale-102"
                              : isHighConfidence
                              ? "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gray-600 hover:text-white"
                              : "bg-amber-950/25 text-amber-500 border-amber-900/50 hover:border-amber-500"
                          }`}
                        >
                          <span>Q{q.questionNumber || 1}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isHighConfidence ? (isSelected ? "bg-black" : "bg-neon-green") : "bg-amber-500"
                          }`}></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Terminal Body */}
              <div className="p-6 overflow-y-auto space-y-6 font-mono text-left flex-1">
                
                {/* Question Text identified */}
                <div className="space-y-2">
                  <div className="text-[9px] text-gray-500 tracking-wider uppercase font-bold flex items-center justify-between">
                    <span>
                      Extracted Question {activeSolved.questionNumber ? `#${activeSolved.questionNumber}` : ""}:
                    </span>
                    {activeSolved.fileName && (
                      <span className="text-gray-500 normal-case font-normal truncate max-w-xs block">
                        Source: {activeSolved.fileName}
                      </span>
                    )}
                  </div>
                  <div className="bg-zinc-950 border border-gray-900 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                    {activeSolved.question}
                  </div>
                </div>

                {/* Parsed options with highlighting if any */}
                {activeSolved.options && activeSolved.options.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[9px] text-gray-500 tracking-wider uppercase font-bold">
                      Extracted Options Matrix:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {activeSolved.options.map((option, idx) => {
                        const lowerOpt = option.trim().toLowerCase();
                        const lowerCorrect = activeSolved.correctAnswer.trim().toLowerCase();
                        
                        const isCorrect = 
                          lowerOpt.startsWith(lowerCorrect) || 
                          lowerOpt.includes(`) ${lowerCorrect}`) ||
                          lowerOpt.includes(`. ${lowerCorrect}`) ||
                          lowerOpt.includes(` ${lowerCorrect} `) ||
                          lowerOpt === lowerCorrect;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                              isCorrect
                                ? "bg-neon-green/10 border-neon-green text-neon-green font-bold"
                                : "bg-zinc-950/40 border-gray-900 text-gray-400"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className={`w-2.5 h-2.5 rounded-full border ${
                                isCorrect ? "bg-neon-green border-neon-green" : "border-gray-800"
                              }`}></span>
                              <span>{option}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[8px] bg-neon-green/20 text-neon-green px-2 py-0.5 rounded font-bold uppercase">
                                Target Detected
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Massive Bold Resolution Output CARD */}
                <div className="p-5 bg-gradient-to-b from-neutral-900/60 to-black border border-neon-cyan/40 rounded-xl space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(0,243,255,0.05)]">
                  
                  {/* Confidence meter */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider ${
                      activeSolved.confidenceStatus === "HIGH" 
                        ? "bg-neon-cyan/15 border-neon-cyan text-neon-cyan animate-pulse-blue"
                        : "bg-amber-500/10 border-amber-500 text-amber-500"
                    }`}>
                      {activeSolved.confidence}% CONFIDENCE
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-neon-cyan tracking-wider font-bold uppercase">
                      CORRECT TARGET IDENTIFIED
                    </div>
                    <div className="text-3xl md:text-4xl font-display font-black text-white tracking-wide uppercase flex items-center space-x-2 shadow-inner">
                      <span>{activeSolved.correctAnswer}</span>
                    </div>
                  </div>

                  {/* Strict explanation of maximum 2 lines */}
                  <div className="border-t border-gray-900 pt-3">
                    <div className="text-[9px] text-gray-500 tracking-wider font-bold uppercase mb-1">
                      AI Reason:
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans italic border-l-2 border-neon-cyan/50 pl-3">
                      {activeSolved.reason}
                    </p>
                  </div>
                </div>

                {/* Warning label if below confidence parameters */}
                {activeSolved.confidence < confidenceThreshold && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-start space-x-2.5 text-amber-500 text-[10px] leading-relaxed">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase block">LOW CONFIDENCE WARNING:</span> Detected accuracy probability fell below calibration threshold of {confidenceThreshold}%. Please check camera lens glare, sharpen handwritten text alignments, or re-scan query.
                    </div>
                  </div>
                )}

              </div>

              {/* Actions Footer Bar */}
              <div className="p-4 bg-zinc-950/80 border-t border-gray-900/90 flex flex-col sm:flex-row gap-3 items-center justify-between font-mono text-xs">
                <button
                  onClick={() => triggerCopyAnswer(activeSolved.correctAnswer)}
                  className="w-full sm:w-auto px-5 py-2 bg-neutral-900 border border-gray-800 hover:border-white text-gray-300 hover:text-white rounded-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {copyAck ? (
                    <>
                      <Check className="w-4 h-4 text-neon-green" />
                      <span className="text-neon-green">COPIED TO TERMINAL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>COPY THIS ANSWER</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const type = activeSolved.sourceType;
                      setActiveSolved(null);
                      if (type === "camera") {
                        setScannerOpen(true);
                      } else if (type === "manual") {
                        setView("dashboard");
                      }
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-neon-green text-black font-bold uppercase rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>SOLVE NEXT</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveSolved(null)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-900 border border-gray-800 text-gray-300 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ==================== ACTIVE WEBRTC SCANNER FRAME OVERLAY ==================== */}
      {scannerOpen && (
        <Scanner
          onSolved={(solved) => {
            saveToHistory(solved);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* FOOTER BAR ELEMENT */}
      <footer className="w-full py-4 text-center text-gray-600 text-[10px] font-mono border-t border-gray-950/70 bg-black/90 z-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} APTScholar Corp. Designed for extreme accuracy MCQ resolution.
          </p>
          <div className="flex space-x-3 text-[9px] text-gray-650">
            <span>SECURE OFFLINE STORAGE ENGINE</span>
            <span>&bull;</span>
            <span>HYBRID OCR</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
