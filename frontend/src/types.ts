export interface User {
  username: string;
  needsPasswordChange: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
}

export interface StudyTask {
  date: string;
  topic: string;
  tasks: string[];
  estimatedHours: number;
  completed: boolean;
}

export interface StudyPlan {
  tasks: StudyTask[];
  startDate: string;
  deadline: string;
  totalHours: number;
}
