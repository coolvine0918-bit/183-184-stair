export interface QuestionOption {
  num: number; // 1, 2, 3, 4, 5
  text: string;
}

export interface QuestionItem {
  id: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: number; // 1 | 2 | 3 | 4 | 5
  source: string; // e.g. "p.183 선거의 기능"
  explanation: string;
}

export interface StudentInfo {
  classRoom: string; // e.g. "1-5", "1-6", "1-7", "1-8"
  studentId: string; // e.g. "15"
  name: string;      // e.g. "홍길동"
}

export interface QuestionAnswer {
  questionId: number;
  selectedOption: number; // 1 to 5, or 0 if unselected
  isCorrect: boolean;
}

export interface QuizSubmission {
  studentInfo: StudentInfo;
  attempt: 1 | 2;
  score: number;
  totalQuestions: number;
  passed: boolean; // score >= 12
  answers: QuestionAnswer[];
  submittedAt: string;
}

export interface GameResult {
  steps: number;
  maxCombo: number;
  obstaclesDodged: number;
  rankTitle: string;
}

export type AppScreen = 'student_info' | 'quiz' | 'feedback' | 'game' | 'game_result';
