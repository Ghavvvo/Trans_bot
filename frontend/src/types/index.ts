export interface Question {
  id: number;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
  };
  correct_answer: string;
  category: string;
}

export interface TestResult {
  id?: number;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  result_id?: number;
}

export interface Test {
  test_id: string;
  questions: Question[];
  type: 'practice' | 'exam';
  category: string;
}

export interface UserAnswer {
  questionId: number;
  answer: 'a' | 'b' | 'c';
}

export interface AnswerCheck {
  correct: boolean;
  correct_answer: string;
  explanation: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
