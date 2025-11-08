
import { GoogleGenAI, Type } from "@google/genai";
import type { StudyPlan, UploadedFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we assume it's set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateStudyPlan = async (
  hoursPerWeek: number,
  startDate: string,
  deadline: string,
  weakTopics: string[],
  uploadedFiles: UploadedFile[]
): Promise<StudyPlan | null> => {
  const prompt = `
    You are an expert IT certification coach. A student needs a personalized study plan.

    Student's constraints and details:
    - Weak Topics (prioritize these): ${weakTopics.join(", ")}. If empty, assume beginner level on all topics.
    - Available Study Time: ${hoursPerWeek} hours per week.
    - Start Date: ${startDate}
    - Deadline: ${deadline}
    - Available Study Materials (titles): ${uploadedFiles.map(f => f.name).join(", ") || 'None'}

    Task:
    Create a detailed, day-by-day study plan from the start date to the deadline.
    - Distribute the study hours evenly across the weeks.
    - Break down topics into smaller, manageable tasks.
    - Ensure weak topics get more attention.
    - Be realistic about what can be achieved in the given time.
    - Generate tasks like "Read chapter X on [topic]", "Complete practice quiz on [topic]", "Watch video on [sub-topic]", "Lab: Configure a basic firewall".
    - The final output must be a valid JSON object matching the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
                  topic: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedHours: { type: Type.NUMBER },
                  completed: { type: Type.BOOLEAN, description: 'Default to false' }
                },
                required: ['date', 'topic', 'tasks', 'estimatedHours', 'completed']
              }
            },
            startDate: { type: Type.STRING },
            deadline: { type: Type.STRING },
            totalHours: { type: Type.NUMBER }
          },
          required: ['tasks', 'startDate', 'deadline', 'totalHours']
        },
      },
    });

    const jsonText = response.text;
    const studyPlanData = JSON.parse(jsonText) as StudyPlan;
    
    // Ensure 'completed' is always set
    studyPlanData.tasks = studyPlanData.tasks.map(task => ({ ...task, completed: false }));
    
    return studyPlanData;
  } catch (error) {
    console.error("Error generating study plan:", error);
    return null;
  }
};
   