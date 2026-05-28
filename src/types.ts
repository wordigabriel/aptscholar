export interface SolvedQuestion {
  id: string;
  questionNumber?: number;
  groupId?: string;
  groupTitle?: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  reason: string;
  confidence: number;
  confidenceStatus: "HIGH" | "LOW";
  timestamp: string;
  sourceType: "camera" | "document" | "manual";
  fileName?: string;
  fileType?: string;
}

export interface AppStats {
  totalSolved: number;
  averageResponseMs: number;
  averageConfidence: number;
}

export type ViewState = "splash" | "dashboard" | "history" | "settings";
