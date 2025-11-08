import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

// Tải các biến môi trường từ tệp .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. Please create a .env file and add it.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Định nghĩa interface cho request body để đảm bảo type safety
interface StudyPlanRequestBody {
  hoursPerWeek: number;
  startDate: string;
  deadline: string;
  weakTopics: string[];
  uploadedFiles: { name: string }[];
}

app.post('/api/generate-study-plan', async (req: Request<{}, {}, StudyPlanRequestBody>, res: Response) => {
  const { hoursPerWeek, startDate, deadline, weakTopics, uploadedFiles } = req.body;

  if (!hoursPerWeek || !startDate || !deadline || !weakTopics) {
      return res.status(400).json({ error: 'Missing required fields in request body.' });
  }
  
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
    const studyPlanData = JSON.parse(jsonText);
    
    // Đảm bảo trường 'completed' luôn được thiết lập
    studyPlanData.tasks = studyPlanData.tasks.map((task: any) => ({ ...task, completed: false }));
    
    res.json(studyPlanData);
  } catch (error) {
    console.error("Error generating study plan from Gemini API:", error);
    res.status(500).json({ error: 'Failed to generate study plan from Gemini API.' });
  }
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
