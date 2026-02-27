// TypeScript interfaces for the Assignment Grading System

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Question {
  id: string;
  questionText: string;
  modelAnswer: string;
  maxMarks: number;
  keywords: string[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  course: string;
  section: string;
  questions: Question[];
  rubric: RubricCriteria;
  createdAt: string;
  createdBy: string;
}

export interface RubricCriteria {
  semantic_similarity: number;
  keyword_coverage: number;
  concept_accuracy: number;
  completeness: number;
  structure: number;
}

export interface StudentInfo {
  name: string;
  studentId: string;
  section: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentInfo: StudentInfo;
  answers: string[];
  gradingResult: GradingResponse | null;
  plagiarismResult: PlagiarismResponse | null;
  reportResult: ReportResponse | null;
  reportFiles: ArtifactFile[];
  submittedAt: string;
  status: 'submitted' | 'graded' | 'reviewed';
}

// Grading Engine Response Types
export interface KeywordCoverage {
  matched_keywords: string[];
  missing_keywords: string[];
  coverage_percentage: number;
}

export interface QuestionGradingResult {
  question_number: number;
  question_text: string;
  marks_awarded: number;
  max_marks: number;
  percentage: number;
  justification: string;
  keyword_coverage: KeywordCoverage;
  missing_points: string[];
  strengths: string[];
  improvement_suggestions: string[];
  concept_accuracy: string;
  completeness: string;
  structure_quality: string;
}

export interface GradingResponse {
  grading_results: QuestionGradingResult[];
  total_marks_awarded: number;
  total_max_marks: number;
  overall_percentage: number;
  overall_grade: string;
  overall_feedback: string;
  performance_category: string;
}

// Plagiarism Detection Response Types
export interface MatchedSubmission {
  student_name: string;
  similarity_percentage: number;
  matched_segments: string[];
  confidence: string;
}

export interface QuestionPlagiarismAnalysis {
  question_number: number;
  similarity_score: number;
  flagged: boolean;
  matched_submissions: MatchedSubmission[];
}

export interface PlagiarismResponse {
  overall_plagiarism_score: number;
  risk_level: string;
  question_analysis: QuestionPlagiarismAnalysis[];
  summary: string;
  recommendation: string;
}

// Report Generator Response Types
export interface ReportResponse {
  report_title: string;
  generated_at: string;
  student_info: Record<string, any>;
  assignment_info: Record<string, any>;
  executive_summary: string;
  overall_performance: Record<string, any>;
  question_breakdown: Record<string, any>[];
  performance_analytics: Record<string, any>;
  improvement_roadmap: Record<string, any>[];
  grade_justification: string;
  integrity_section: Record<string, any>;
}

export interface ArtifactFile {
  file_url: string;
  name: string;
  format_type: string;
}

// Mock User
export interface MockUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department?: string;
}
