import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

export const generateQuizQuestions = async (topic: string): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const effectiveTopic = topic.trim() || "General Knowledge";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 10 multiple-choice trivia questions about "${effectiveTopic}". 
      Each question must have exactly 4 options. 
      Ensure the questions are engaging and factually accurate.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the question (e.g. q1, q2)" },
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "An array of exactly 4 possible answers."
              },
              answer: { type: Type.STRING, description: "The correct answer text, must match one of the options exactly." },
              explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." }
            },
            required: ["id", "question", "options", "answer", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini");
    }

    const questions: QuizQuestion[] = JSON.parse(text);
    return questions;

  } catch (error) {
    console.error("Failed to generate quiz:", error);
    throw error;
  }
};
