
import { QuizQuestion } from './types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which of the following is NOT a fundamental principle of information security (CIA Triad)?",
    options: ["Confidentiality", "Integrity", "Availability", "Authorization"],
    correctAnswer: "Authorization",
    topic: "Security Fundamentals"
  },
  {
    id: 2,
    question: "In networking, which protocol is responsible for translating domain names to IP addresses?",
    options: ["HTTP", "FTP", "DNS", "TCP"],
    correctAnswer: "DNS",
    topic: "Networking"
  },
  {
    id: 3,
    question: "What is the primary purpose of a Docker container?",
    options: [
      "To run a full-fledged operating system",
      "To package an application with its dependencies",
      "To manage virtual machines",
      "To provide physical server hardware"
    ],
    correctAnswer: "To package an application with its dependencies",
    topic: "DevOps & Containers"
  },
  {
    id: 4,
    question: "Which cloud computing model provides virtualized computing resources over the internet?",
    options: ["SaaS", "PaaS", "IaaS", "FaaS"],
    correctAnswer: "IaaS",
    topic: "Cloud Computing"
  },
  {
    id: 5,
    question: "What does SQL stand for?",
    options: [
      "Structured Question Language",
      "Strong Query Language",
      "Structured Query Language",
      "Simple Query Language"
    ],
    correctAnswer: "Structured Query Language",
    topic: "Databases"
  }
];
   