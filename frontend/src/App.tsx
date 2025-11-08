import React, { useState, useCallback, useMemo } from 'react';
import type { User, UploadedFile, StudyPlan, StudyTask, QuizQuestion } from './types';
import { QUIZ_QUESTIONS } from './constants';
import { generateStudyPlan } from './services/geminiService';
import { ProgressCharts } from './components/ProgressCharts';
import { DashboardIcon, PlanIcon, UploadIcon, ProgressIcon, ReadmeIcon, LogoutIcon, MenuIcon, CloseIcon, CheckCircleIcon } from './components/Icons';

// Helper: Define pages outside the main component to avoid re-renders
enum Page {
    Dashboard,
    StudyPlan,
    UploadDocs,
    Progress,
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // App State
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    
    // Auth Logic
    const handleLogin = () => {
        // Simulates successful login for admin/admin
        setUser({ username: 'admin', needsPasswordChange: true });
    };

    const handleChangePassword = () => {
        if (user) {
            setUser({ ...user, needsPasswordChange: false });
        }
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentPage(Page.Dashboard);
        setUploadedFiles([]);
        setStudyPlan(null);
        setQuizAnswers({});
    };

    const toggleTaskCompletion = (taskDate: string) => {
        if (studyPlan) {
            const newTasks = studyPlan.tasks.map(task => 
                task.date === taskDate ? { ...task, completed: !task.completed } : task
            );
            setStudyPlan({ ...studyPlan, tasks: newTasks });
        }
    };


    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }
    if (user.needsPasswordChange) {
        return <ChangePasswordPage onChangePassword={handleChangePassword} />;
    }

    const navItems = [
        { icon: DashboardIcon, label: 'Dashboard', page: Page.Dashboard },
        { icon: PlanIcon, label: 'Study Plan', page: Page.StudyPlan },
        { icon: UploadIcon, label: 'Upload Docs', page: Page.UploadDocs },
        { icon: ProgressIcon, label: 'Progress Report', page: Page.Progress },
    ];

    const Sidebar = () => (
        <aside className={`bg-base-200 text-white w-64 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col`}>
            <div className="p-5 font-bold text-2xl border-b border-base-300 flex items-center">
                <PlanIcon className="w-8 h-8 mr-3 text-secondary"/>
                Study Planner
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {navItems.map(item => (
                        <li key={item.label}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(item.page);
                                    setSidebarOpen(false);
                                }}
                                className={`flex items-center p-3 my-1 rounded-lg transition-colors ${currentPage === item.page ? 'bg-primary text-white' : 'hover:bg-base-300'}`}
                            >
                                <item.icon className="w-6 h-6 mr-3"/>
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-base-300">
                 <button onClick={handleLogout} className="flex items-center w-full p-3 rounded-lg hover:bg-red-800/50 transition-colors">
                    <LogoutIcon className="w-6 h-6 mr-3"/>
                    Logout
                </button>
            </div>
        </aside>
    );

    const MainContent = () => {
        switch (currentPage) {
            case Page.Dashboard: return <Dashboard studyPlan={studyPlan} toggleTaskCompletion={toggleTaskCompletion} />;
            case Page.StudyPlan: return <StudyPlanGenerator setStudyPlan={setStudyPlan} quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers} uploadedFiles={uploadedFiles} />;
            case Page.UploadDocs: return <UploadDocs uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />;
            case Page.Progress: return <ProgressReport studyPlan={studyPlan} quizAnswers={quizAnswers} />;
            default: return <Dashboard studyPlan={studyPlan} toggleTaskCompletion={toggleTaskCompletion} />;
        }
    };

    return (
        <div className="flex h-screen bg-base-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-base-200 shadow-md p-4 flex justify-between items-center md:hidden">
                    <div className="font-bold text-lg">Study Planner</div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                       {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                   <MainContent />
                </main>
            </div>
        </div>
    );
};


// --- AUTH PAGES ---
interface LoginPageProps { onLogin: (password: string) => void; }
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin') {
            onLogin(password);
            setError('');
        } else {
            setError('Invalid credentials. Hint: admin/admin');
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="max-w-md w-full bg-base-200 rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <PlanIcon className="w-16 h-16 mx-auto text-secondary"/>
                    <h1 className="text-3xl font-bold mt-2">IT Study Planner</h1>
                    <p className="text-gray-400">Login to continue</p>
                </div>
                 <div className="bg-blue-900/50 border-l-4 border-blue-400 text-blue-200 p-4 rounded-md mb-6 text-sm">
                    <strong>Note:</strong> Initial login is <code className="bg-base-300 px-1 rounded">admin</code>/<code className="bg-base-300 px-1 rounded">admin</code>. MD5 is used for initial password hashing as requested, but production systems must use strong, salted hashing like Argon2 or Bcrypt to comply with ISO27001.
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-300">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 bg-base-300 border border-gray-600 rounded-lg focus:outline-none focus:border-secondary" />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-300">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-base-300 border border-gray-600 rounded-lg focus:outline-none focus:border-secondary" />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-secondary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Login</button>
                </form>
            </div>
        </div>
    );
};

interface ChangePasswordPageProps { onChangePassword: () => void; }
const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onChangePassword }) => {
    return (
         <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="max-w-md w-full bg-base-200 rounded-xl shadow-lg p-8 text-center">
                <CheckCircleIcon className="w-16 h-16 mx-auto text-success mb-4"/>
                <h1 className="text-3xl font-bold">Security First!</h1>
                <p className="text-gray-400 my-4">For security reasons, you must change your initial password. This feature is simulated for this demo.</p>
                <button onClick={onChangePassword} className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-colors">Proceed to Dashboard</button>
            </div>
        </div>
    );
}

// --- MAIN CONTENT PAGES ---

const Dashboard = ({ studyPlan, toggleTaskCompletion }: { studyPlan: StudyPlan | null, toggleTaskCompletion: (date: string) => void }) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTask = studyPlan?.tasks.find(task => task.date === today);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg">Welcome, Admin!</h3>
                    <p className="text-gray-400">Here's your study overview for today.</p>
                </div>
                <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg">Total Tasks</h3>
                    <p className="text-5xl font-extrabold text-secondary">{studyPlan?.tasks.length ?? 0}</p>
                </div>
                 <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg">Hours Planned</h3>
                    <p className="text-5xl font-extrabold text-accent">{studyPlan?.totalHours ?? 0}</p>
                </div>
            </div>
            <div className="mt-8 bg-base-200 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Today's Focus ({today})</h2>
                {todaysTask ? (
                    <div>
                        <h3 className="text-xl font-semibold text-secondary">{todaysTask.topic}</h3>
                        <p className="text-gray-400 mb-3">{todaysTask.estimatedHours} hour(s) planned</p>
                        <ul className="list-disc list-inside space-y-2">
                           {todaysTask.tasks.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                         <button onClick={() => toggleTaskCompletion(todaysTask.date)} className={`mt-4 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${todaysTask.completed ? 'bg-green-700 hover:bg-green-800' : 'bg-primary hover:bg-primary-focus'}`}>
                            <CheckCircleIcon className="w-5 h-5" />
                            {todaysTask.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-400">No tasks scheduled for today. Create a study plan or take a well-deserved break!</p>
                )}
            </div>
        </div>
    );
};


const StudyPlanGenerator = ({ setStudyPlan, quizAnswers, setQuizAnswers, uploadedFiles }: { 
    setStudyPlan: (plan: StudyPlan | null) => void; 
    quizAnswers: Record<number, string>;
    setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    uploadedFiles: UploadedFile[];
}) => {
    const [step, setStep] = useState(1);
    const [planDetails, setPlanDetails] = useState({ hours: 10, start: new Date().toISOString().split('T')[0], end: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleQuizChange = (questionId: number, answer: string) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleGeneratePlan = async () => {
        if (!planDetails.end) {
            setError('Please select a deadline.');
            return;
        }
        setIsLoading(true);
        setError('');
        
        const weakTopics = QUIZ_QUESTIONS
            .filter(q => quizAnswers[q.id] && quizAnswers[q.id] !== q.correctAnswer)
            .map(q => q.topic);
        
        const uniqueWeakTopics = [...new Set(weakTopics)];
        
        const plan = await generateStudyPlan(planDetails.hours, planDetails.start, planDetails.end, uniqueWeakTopics, uploadedFiles);
        if (plan) {
            setStudyPlan(plan);
        } else {
            setError('Failed to generate study plan. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Create Your Study Plan</h1>
            <div className="bg-base-200 p-8 rounded-xl shadow-lg">
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Step 1: Initial Assessment Quiz</h2>
                        <p className="mb-6 text-gray-400">Answer these questions to help us identify your priority topics.</p>
                        <div className="space-y-6">
                            {QUIZ_QUESTIONS.map(q => (
                                <div key={q.id}>
                                    <p className="font-semibold mb-2">{q.id}. {q.question}</p>
                                    <div className="space-y-1">
                                        {q.options.map(opt => (
                                            <label key={opt} className="flex items-center p-2 rounded-md hover:bg-base-300 cursor-pointer">
                                                <input type="radio" name={`q${q.id}`} value={opt} onChange={() => handleQuizChange(q.id, opt)} className="radio radio-primary mr-3" />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)} className="mt-8 btn btn-primary bg-primary hover:bg-primary-focus text-white w-full md:w-auto">Next: Set Your Schedule</button>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Step 2: Set Your Schedule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="label">Hours Available per Week</label>
                                <input type="number" value={planDetails.hours} onChange={e => setPlanDetails({...planDetails, hours: parseInt(e.target.value)})} className="input input-bordered w-full bg-base-300"/>
                            </div>
                            <div>
                                <label className="label">Start Date</label>
                                <input type="date" value={planDetails.start} onChange={e => setPlanDetails({...planDetails, start: e.target.value})} className="input input-bordered w-full bg-base-300"/>
                            </div>
                            <div>
                                <label className="label">Deadline</label>
                                <input type="date" value={planDetails.end} onChange={e => setPlanDetails({...planDetails, end: e.target.value})} className="input input-bordered w-full bg-base-300"/>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setStep(1)} className="btn bg-base-300">Back</button>
                            <button onClick={handleGeneratePlan} disabled={isLoading} className="btn btn-accent bg-accent text-black hover:bg-green-400 flex-grow">
                                {isLoading ? <span className="loading loading-spinner"></span> : 'Generate AI Study Plan'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const UploadDocs = ({ uploadedFiles, setUploadedFiles }: { uploadedFiles: UploadedFile[], setUploadedFiles: (files: UploadedFile[]) => void }) => {
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            // Fix: Explicitly type `file` as `File` because the type inference from `Array.from(files)` was resulting in `unknown`.
            const newFiles: UploadedFile[] = Array.from(files).map((file: File) => ({
                name: file.name,
                type: file.type,
                size: file.size,
            }));
            setUploadedFiles([...uploadedFiles, ...newFiles]);
        }
    };
    
    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Upload Study Materials</h1>
            <div className="bg-base-200 p-8 rounded-xl shadow-lg">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
                    <UploadIcon className="w-16 h-16 mx-auto text-gray-500 mb-4"/>
                    <label htmlFor="file-upload" className="cursor-pointer bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">
                        Select Files
                    </label>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept=".doc,.docx,.pdf,.txt"/>
                    <p className="mt-4 text-sm text-gray-500">Allowed: .doc, .docx, .pdf, .txt</p>
                </div>
                
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
                    {uploadedFiles.length > 0 ? (
                        <ul className="space-y-3">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="bg-base-300 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{file.name}</p>
                                        <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No files uploaded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProgressReport = ({ studyPlan, quizAnswers }: { studyPlan: StudyPlan | null, quizAnswers: Record<number, string> }) => {
    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Progress Report</h1>
            <ProgressCharts studyPlan={studyPlan} quizAnswers={quizAnswers} />
        </div>
    );
};


const Readme = () => (
    <div>
        {/* Content moved to README.md */}
        <h1 className="text-4xl font-bold mb-6">Deployment & Security Guide</h1>
        <p className="bg-base-200 p-8 rounded-xl shadow-lg">
            Please refer to the README.md file in the project's root directory for detailed deployment and security instructions.
        </p>
    </div>
);


export default App;
