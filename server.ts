import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

// Increase request size limit for base64 images and PDFs
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve API routes first
app.post("/api/solve", async (req, res) => {
  try {
    const { image, fileData, text, mimeType } = req.body;

    // Check if API key is present
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.",
      });
    }

    let contents: any[] = [];
    let promptSubject = "";

    // 1. Process Text Input
    if (text && text.trim()) {
      contents.push({ text: `Question/Content provided:\n${text}` });
      promptSubject = "text-only question";
    }

    // 2. Process Image base64 input
    if (image) {
      // Strip base64 headers if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/png",
          data: base64Data,
        },
      });
      promptSubject = "scanned/captured question image";
    }

    // 3. Process Uploaded Documents
    if (fileData) {
      const base64Data = fileData.replace(/^data:[\w/\-+.]+;base64,/, "");
      const detectedMime = mimeType || "application/pdf";

      if (detectedMime === "application/pdf") {
        contents.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        });
        promptSubject = "uploaded PDF document";
      } else if (
        detectedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        detectedMime.includes("docx") ||
        detectedMime.includes("word")
      ) {
        // Handle Word DOCX with mammoth helper
        try {
          const docxBuffer = Buffer.from(base64Data, "base64");
          const extraction = await mammoth.extractRawText({ buffer: docxBuffer });
          const extractedText = extraction.value;
          contents.push({ text: `Extracted text from Word Document:\n${extractedText}` });
          promptSubject = "Word Document (DOCX)";
        } catch (docxErr: any) {
          console.error("Mammoth DOCX parsing failed:", docxErr);
          return res.status(400).json({
            error: "Failed to extract text from Word document. " + docxErr.message,
          });
        }
      } else if (detectedMime.includes("text/") || detectedMime.includes("plain")) {
        // Handle Plain Text
        const decodedText = Buffer.from(base64Data, "base64").toString("utf-8");
        contents.push({ text: `Extracted text from Document:\n${decodedText}` });
        promptSubject = "Plain Text document";
      } else {
        // Fallback: try to pass standard files, or treat as image/pdf directly
        contents.push({
          inlineData: {
            mimeType: detectedMime,
            data: base64Data,
          },
        });
        promptSubject = "uploaded file";
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({
        error: "No source question, image, or document was provided.",
      });
    }

    // Combine visual content with strict solving instructions
    const systemInstruction = `You are APTScholar, an elite, ultra-fast quiz and exam solver. Your sole purpose is to solve ALL questions and multiple-choice options with maximum speed, accuracy, and absolute precision.

Rules:
1. Scan the image, text, or document provided and detect EVERY single independent objective test question, True/False question, numbered choice question or quiz question present (you can detect and solve up to 100 questions in a single run!).
2. Identify all options for each question (like A, B, C, D; 1, 2, 3, 4; Roman numerals; checkboxes; True/False).
3. Determine the correct option with high scientific accuracy. Avoid guesswork. If you are not confident or a particular question is unreadable, mark confidence low and set confidenceStatus to "LOW".
4. Return ONLY the detected correct answer code/text, and a brief, highly concise 2-sentence/2-line explanation.
5. Keep the explanation for each question strictly limited to max 2 short lines. No introductory remarks, no greetings, no bloated paragraphs. Direct, absolute precision.
6. Extract the raw parsed question text so the user knows exactly what you identified for each question. List options clearly for each.`;

    contents.push({
      text: "Scan this document/image/text. Detect each and every objective or multiple-choice question. Solve each one, providing the extracted question text, options, correct answer choice, confidence rating, and a concise explanation of max 2 lines. Track them sequentially in a JSON array of questions.",
    });

    // Call the high-speed gemini-3.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for absolute precision & deterministic quiz solving
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "The list of all independent objective questions identified and solved from the scanned content sequentially (supporting up to 100 questions).",
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: {
                    type: Type.INTEGER,
                    description: "The ordinal question number (e.g. 1, 2, 3) relative to the document or image sequential ordering.",
                  },
                  question: {
                    type: Type.STRING,
                    description: "The full text of the question identified from the user scan/upload.",
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Extracted options (e.g., ['A. True', 'B. False'] or ['1) Option 1', '2) Option 2']) if any were detected for this question.",
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The correct option identifier (e.g. 'B', 'Option 3', 'True', 'A'). Keep it short.",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "The explanation for this answer. Must be strictly 1 or 2 lines maximum, precise, and completely direct.",
                  },
                  confidence: {
                    type: Type.INTEGER,
                    description: "Confidence percentage of solving correctness for this specific question (0-100).",
                  },
                  confidenceStatus: {
                    type: Type.STRING,
                    description: "Set to 'HIGH' if confidence >= 70% and the question is solved with certainty, or 'LOW' if the resolution is uncertain.",
                  },
                },
                required: ["questionNumber", "question", "correctAnswer", "reason", "confidence", "confidenceStatus"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty response text from Gemini.");
    }

    // Send the JSON response parsed successfully
    const parsedData = JSON.parse(resultText);
    res.json({
      success: true,
      data: parsedData,
      subject: promptSubject,
    });
  } catch (err: any) {
    console.error("Error solving question via Gemini:", err);
    res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred while compiling the AI response.",
    });
  }
});

// Setup dev server with Vite in development, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[APTScholar Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
