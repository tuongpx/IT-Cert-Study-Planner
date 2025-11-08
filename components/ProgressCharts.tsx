
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { StudyPlan } from '../types';
import { QUIZ_QUESTIONS } from '../constants';

const COLORS = ['#10b981', '#374151'];

interface ProgressChartsProps {
  studyPlan: StudyPlan | null;
  quizAnswers: Record<number, string>;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ studyPlan, quizAnswers }) => {
  // Progress Chart Data
  const completedTasks = studyPlan?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = studyPlan?.tasks.length || 0;
  const progressData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Remaining', value: totalTasks - completedTasks },
  ];

  // Mastery Chart Data
  const topicMastery: Record<string, { correct: number; total: number }> = {};
  QUIZ_QUESTIONS.forEach(q => {
    if (!topicMastery[q.topic]) {
      topicMastery[q.topic] = { correct: 0, total: 0 };
    }
    topicMastery[q.topic].total += 1;
    if (quizAnswers[q.id] === q.correctAnswer) {
      topicMastery[q.topic].correct += 1;
    }
  });

  const masteryData = Object.entries(topicMastery).map(([topic, data]) => ({
    name: topic,
    Mastery: (data.correct / data.total) * 100,
  }));
  
  if (!studyPlan) {
    return <div className="text-center p-8 bg-base-200 rounded-lg">No study plan available to show progress.</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-base-200 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-200">Task Completion</h3>
        {totalTasks > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={progressData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {progressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center h-[300px] flex items-center justify-center">No tasks in the plan yet.</p>
        )}
      </div>
      <div className="bg-base-200 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-200">Topic Mastery (from Quiz)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={masteryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
            <YAxis type="category" dataKey="name" width={120} stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Bar dataKey="Mastery" fill="#4f46e5" barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
   