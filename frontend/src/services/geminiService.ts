import type { StudyPlan, UploadedFile } from '../types';

// URL của backend. Trong một ứng dụng production thực tế, đây sẽ là một đường dẫn tương đối
// hoặc được cấu hình thông qua biến môi trường.
const BACKEND_URL = 'http://localhost:5001';

export const generateStudyPlan = async (
  hoursPerWeek: number,
  startDate: string,
  deadline: string,
  weakTopics: string[],
  uploadedFiles: UploadedFile[]
): Promise<StudyPlan | null> => {

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-study-plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            hoursPerWeek,
            startDate,
            deadline,
            weakTopics,
            uploadedFiles,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
    }

    const studyPlanData = await response.json() as StudyPlan;
    
    // Backend đã đảm bảo 'completed' được thiết lập, nhưng chúng ta có thể kiểm tra lại
    // ở phía client để tăng tính ổn định.
    if (studyPlanData.tasks) {
      studyPlanData.tasks = studyPlanData.tasks.map(task => ({ ...task, completed: task.completed ?? false }));
    }

    return studyPlanData;
  } catch (error) {
    console.error("Error calling backend to generate study plan:", error);
    return null;
  }
};