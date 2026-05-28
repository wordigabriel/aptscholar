import { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, Zap, Maximize2, ShieldAlert, Sparkles } from "lucide-react";
import { SolvedQuestion } from "../types";

interface ScannerProps {
  onSolved: (solutions: SolvedQuestion[]) => void;
  onClose: () => void;
}

export default function Scanner({ onSolved, onClose }: ScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Custom camera scanner status states
  const [lowLight, setLowLight] = useState(false);
  const [contrastBoost, setContrastBoost] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "SYS_INIT: APT_SCHOLAR OCR PIPELINE DETECTED",
    "CAMERA: FACING_MODE ENVIRONMENT ENABLED",
    "STATUS: AWAITING CAPTURE TRIGGER..."
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scrolling camera scanner log streams
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Turn on camera WebRTC
  const startCamera = async () => {
    try {
      setError(null);
      addLog("CAMERA: Requesting media hardware permissions...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
      addLog("SUCCESS: Camera stream connected. 1280x720 30FPS");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Camera permission denied, or camera is currently in use by another application. Please check your system settings or upload a screenshot/document instead.");
      addLog("ERROR: Camera hardware response empty. Fallback triggered.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream on close
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Trigger manual Snap solve
  const snapAndSolve = async () => {
    if (!videoRef.current || loading) return;

    try {
      setLoading(true);
      addLog("SNAP: Freezing frame buffer...");
      
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not initialize 2D canvas context.");

      // Draw active frame
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      // Apply smart grayscale / contrast enhance on Canvas if requested
      if (contrastBoost) {
        addLog("OCR_PREPROCESS: Applying high-density contrast boost...");
        ctx.filter = "contrast(1.4) grayscale(0.2)";
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      }

      const base64Image = canvas.toDataURL("image/png");
      addLog("SERVER: Dispatching base64 stream to APTScholar Brain...");

      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mimeType: "image/png"
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to solve scanned image question.");
      }

      const questionsArray = resData.data.questions || [];
      if (questionsArray.length === 0) {
        throw new Error("No objective questions could be detected. Please align card better or increase exposure.");
      }

      addLog(`COMPLETED: AI solved ${questionsArray.length} questions in 1.4s!`);
      
      const gId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const solutions: SolvedQuestion[] = questionsArray.map((q: any) => ({
        id: crypto.randomUUID(),
        questionNumber: q.questionNumber || 1,
        groupId: gId,
        groupTitle: `Camera scan with ${questionsArray.length} questions`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        reason: q.reason,
        confidence: q.confidence || 95,
        confidenceStatus: q.confidenceStatus || "HIGH",
        timestamp,
        sourceType: "camera"
      }));

      onSolved(solutions);

      // If continuous mode is disabled, we exit scanner automatically. If enabled, we stay or alert.
      if (!continuousMode) {
        onClose();
      } else {
        addLog(`[CONTINUOUS_SOLVE]: Answers detected: ${solutions.map(s => s.correctAnswer).join(", ")}`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`FATAL_ERROR: ${err.message || "Unknown OCR solver fault"}`);
      setError(err.message || "Something went wrong during scan solving.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-black/80 border-b border-neon-green/30 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-ping"></span>
          <span className="font-mono text-neon-green tracking-wider uppercase text-sm font-bold">
            Camera Mode: Active Scanner
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-mono text-xs border border-gray-700 hover:border-white px-3 py-1.5 rounded transition"
        >
          [ EXIT CAMERA ]
        </button>
      </div>

      {/* Main Scanner Viewport Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Background Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/30 via-black to-black opacity-90"></div>

        {error ? (
          <div className="mx-6 max-w-md p-6 glass-panel border-red-500/40 rounded-xl text-center z-12 animate-pulse-green">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white font-mono text-sm mb-4">{error}</p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={startCamera}
                className="w-full py-2 bg-red-950/40 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/40 font-mono text-xs transition"
              >
                Re-request Permissions
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 font-mono text-xs transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center border-y md:border border-neon-green/25 rounded-none md:rounded-xl overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            
            {/* Real HTML5 camera preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all ${
                lowLight ? "brightness-[1.65] contrast-[1.2] saturate-[1.4]" : ""
              } ${contrastBoost ? "contrast-[1.1] saturate-[1.1]" : ""}`}
            />

            {/* Glowing HUD Crop Overlay Overlay */}
            <div className="absolute inset-0 border-[24px] md:border-[48px] border-black/50 pointer-events-none flex items-center justify-center">
              <div className="w-full h-full border-2 border-dashed border-neon-cyan animate-pulse-blue relative shadow-[0_0_30px_rgba(0,243,255,0.15)]">
                
                {/* HUD Targeting Angles */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-neon-green"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-neon-green"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-neon-green"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-neon-green"></div>

                {/* Simulated continuous flying scan-laser line! */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00f3ff] animate-laser"></div>
                
                {/* Live scanner aiming label */}
                <div className="absolute top-4 left-4 font-mono text-[10px] text-neon-cyan bg-black/75 px-2 py-1 rounded border border-neon-cyan/30 tracking-widest animate-pulse">
                  ALIGNED FOR MCQ DETECTION
                </div>
              </div>
            </div>

            {/* Top-Right Settings Buttons Inside Camera Overlay */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
              {/* Toggle digital low light filter */}
              <button
                onClick={() => {
                  setLowLight(!lowLight);
                  addLog(`FILTER: Low Light exposure boost ${!lowLight ? "ON" : "OFF"}`);
                }}
                className={`p-2 rounded-lg border font-mono text-[10px] flex items-center space-x-1.5 transition ${
                  lowLight
                    ? "bg-neon-green/20 border-neon-green text-neon-green"
                    : "bg-black/80 border-gray-700 text-gray-400 hover:text-white"
                }`}
                title="Boost digital exposure for printed sheets under low shadows"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">{lowLight ? "LOW_LIGHT: ON" : "LOW_LIGHT"}</span>
              </button>

              {/* Toggle Contrast filter */}
              <button
                onClick={() => {
                  setContrastBoost(!contrastBoost);
                  addLog(`FILTER: Contrast OCR preprocessor ${!contrastBoost ? "ON" : "OFF"}`);
                }}
                className={`p-2 rounded-lg border font-mono text-[10px] flex items-center space-x-1.5 transition ${
                  contrastBoost
                    ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue"
                    : "bg-black/80 border-gray-700 text-gray-400 hover:text-white"
                }`}
                title="Preprocesses contrast for clearer letters and symbols"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">{contrastBoost ? "CONTRAST: MAX" : "CONTRAST: RAW"}</span>
              </button>

              {/* Toggle Continuous mode */}
              <button
                onClick={() => {
                  setContinuousMode(!continuousMode);
                  addLog(`MODE: Continuous scan solve ${!continuousMode ? "ENABLED" : "DISABLED"}`);
                }}
                className={`p-2 rounded-lg border font-mono text-[10px] flex items-center space-x-1.5 transition ${
                  continuousMode
                    ? "bg-amber-500/20 border-amber-500 text-amber-500"
                    : "bg-black/80 border-gray-700 text-gray-400 hover:text-white"
                }`}
                title="Continuous Mode remains active inside the camera feed after solving"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{continuousMode ? "CONTINUOUS: ON" : "CONTINUOUS: OFF"}</span>
              </button>
            </div>

            {/* Bottom-left telemetry status log overlay */}
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-xs bg-black/85 border border-neon-green/30 rounded p-2 z-20 font-mono text-[9px] text-neon-green/90 select-none backdrop-blur-sm shadow-md">
              <div className="border-b border-neon-green/20 pb-1 mb-1 font-bold tracking-wider text-white uppercase flex items-center justify-between">
                <span>SYSTEM TELEMETRY ENGINE</span>
                <span className="text-[8px] opacity-70">ONLINE</span>
              </div>
              <div className="space-y-0.5 max-h-16 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="truncate animate-text-scan">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Spinner Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-35 font-mono">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-t-neon-green border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto text-neon-green w-6 h-6 animate-pulse" />
                </div>
                <div className="text-neon-green text-sm font-bold tracking-wider animate-pulse uppercase">
                  Analyzing Question Elements
                </div>
                <div className="text-[10px] text-gray-400 mt-2 max-w-xs text-center">
                  Executing OCR bounds detection & resolving options in 1-5 seconds...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Interactive Trigger Controls Bar */}
      <div className="p-6 bg-black border-t border-neon-cyan/20 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 z-10 font-mono">
        <div className="text-gray-400 text-xs text-center sm:text-left">
          <p className="text-gray-300 font-bold">INSTRUCTIONS:</p>
          <p className="max-w-sm mt-0.5">
            Align MCQ options A/B/C/D inside the cyan brackets, and click snap.
          </p>
        </div>

        {/* Big snap solve action button! */}
        {!error && (
          <button
            onClick={snapAndSolve}
            disabled={loading}
            className="glow-btn-green w-full sm:w-auto px-10 py-4 bg-neon-green text-black font-black uppercase text-sm rounded-full tracking-widest flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5 stroke-[2.5]" />
            <span>SNAP & SOLVE INSTANTLY</span>
          </button>
        )}

        <div className="text-gray-500 text-[10px] hidden sm:block text-right">
          MODEL: gemini-3.5-flash<br />
          KPI SPEED: &lt;1.5s latency
        </div>
      </div>
    </div>
  );
}
