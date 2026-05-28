import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, CheckCircle, HelpCircle, ShieldAlert, Sparkles } from "lucide-react";
import { SolvedQuestion } from "../types";

interface DocUploaderProps {
  onSolved: (solutions: SolvedQuestion[]) => void;
}

export default function DocUploader({ onSolved }: DocUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse filesize to friendly text
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Drag and drop events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Convert uploaded document or image to base64, then post it
  const processFile = async (file: File) => {
    // 1. Validate file types
    const validTypes = [
      "application/pdf",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    ];

    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isDocx = fileExt === ".docx";
    const isTxt = fileExt === ".txt";
    const isDoc = fileExt === ".doc";

    if (!validTypes.includes(file.type) && !isDocx && !isTxt) {
      setError("Unsupported file format detected. Please upload PDF, Word (DOCX), Plain Text (TXT), or images (PNG/JPG).");
      return;
    }

    // Max limit is 12MB. Double-check.
    if (file.size > 12 * 1024 * 1024) {
      setError("File exceeds maximum upload index limit of 12MB. Please upload a smaller document.");
      return;
    }

    setError(null);
    setSelectedFile({
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || fileExt.replace(".", "").toUpperCase()
    });

    try {
      setLoading(true);

      // Read file into Base64 format
      const reader = new FileReader();
      reader.onload = async () => {
        let base64String = reader.result as string;
        let finalMimeType = file.type || (isDocx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain");

        // Optimize and compress client-side images (PNG/JPEG) to dramatically increase speed and decrease latency
        if (file.type && file.type.startsWith("image/")) {
          try {
            base64String = await new Promise<string>((resolve) => {
              const img = new Image();
              img.onload = () => {
                let width = img.width;
                let height = img.height;
                const MAX_DIMENSION = 1024;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                  if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                  } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                  }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL("image/jpeg", 0.82));
                } else {
                  resolve(reader.result as string);
                }
              };
              img.onerror = () => resolve(reader.result as string);
              img.src = reader.result as string;
            });
            finalMimeType = "image/jpeg";
          } catch (compressErr) {
            console.warn("Client-side compression skipped:", compressErr);
          }
        }
        
        // Post to express backend
        const response = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64String,
            mimeType: finalMimeType
          })
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "The AI model was unable to resolve questions inside this file.");
        }

        const questionsArray = resData.data.questions || [];
        if (questionsArray.length === 0) {
          throw new Error("No objective, multiple-choice, or true/false questions could be found in the uploaded file.");
        }

        const gId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const solutions: SolvedQuestion[] = questionsArray.map((q: any) => ({
          id: crypto.randomUUID(),
          questionNumber: q.questionNumber || 1,
          groupId: gId,
          groupTitle: `Scan of "${file.name}" (${questionsArray.length} questions solved)`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          reason: q.reason,
          confidence: q.confidence || 95,
          confidenceStatus: q.confidenceStatus || "HIGH",
          timestamp,
          sourceType: "document",
          fileName: file.name,
          fileType: fileExt.replace(".", "").toUpperCase()
        }));

        onSolved(solutions);
        setLoading(false);
      };

      reader.onerror = () => {
        throw new Error("Local FileReader failed to read file bytes.");
      };

      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error("Document solve failed:", err);
      setError(err.message || "Something went wrong while processing file solver.");
      setLoading(false);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`relative w-full py-8 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[180px] ${
          dragActive
            ? "border-neon-green bg-neon-green/10"
            : "border-gray-700/60 hover:border-neon-cyan bg-black/40 hover:bg-black/60"
        } glass-panel`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border-4 border-t-cyber-blue border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-cyber-blue w-5 h-5 animate-pulse" />
            </div>
            <p className="text-white text-sm font-mono tracking-wider font-bold uppercase animate-pulse">
              EXTRACTING & SOLVING QUESTION
            </p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
              Selected: <span className="text-cyber-blue font-mono">{selectedFile?.name}</span> ({selectedFile?.size})
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-full text-neon-cyan mb-3 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(0,243,255,0.05)]">
              <UploadCloud className="w-8 h-8" />
            </div>

            <p className="text-white font-mono text-xs uppercase tracking-wider font-semibold">
              <span className="text-neon-cyan">Drag and Drop</span> or <span className="text-neon-green">Browse Files</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 max-w-sm leading-relaxed">
              Supports <strong className="text-white">PDF</strong>, <strong className="text-white">DOCX</strong>, <strong className="text-white">TXT</strong>, and <strong className="text-white">Images</strong> up to <span className="font-mono text-neon-green">12MB</span>.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-950/20 border border-red-500/30 rounded-xl flex items-start space-x-2 text-red-400 animate-pulse-green">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono leading-relaxed">
            <span className="font-bold">SOLVER_ALERT:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
}
