
export type QuestionType = 'CHOICE' | 'TEXT';
export type ExamMode = 'ADULT' | 'KIDS';
export type StudentStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'TIMEOUT';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: { key: string; text: string }[];
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  month: number; // 1-16
  mode: ExamMode;
  duration: number; // in minutes
  questions: Question[];
  published: boolean;
  centerId: string;
  createdAt: number;
}

export interface StudentRecord {
  id: string;
  examId: string;
  firstName: string;
  lastName: string;
  startTime?: number;
  endTime?: number;
  status: StudentStatus;
  answers: Record<string, string>; // questionId: answer
  score: number;
  totalPoints: number;
}

export interface Center {
  id: string;
  name: string;
  email: string;
  location: string;
}

export interface User {
  role: 'SUPER_ADMIN' | 'CENTER_ADMIN' | 'STUDENT';
  centerId?: string;
  name?: string;
}
