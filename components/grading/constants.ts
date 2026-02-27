import type {
  Assignment,
  Submission,
  MockUser,
  RubricCriteria,
  GradingResponse,
  PlagiarismResponse,
} from './types';

// Agent IDs
export const GRADING_AGENT_ID = '69a1799371517abcd697bccf';
export const PLAGIARISM_AGENT_ID = '69a17994c9b0fb4e32c2e670';
export const REPORT_AGENT_ID = '69a17994c630aea0386ccd09';

// Agent Info for status display
export const AGENTS = [
  { id: GRADING_AGENT_ID, name: 'Grading Engine', purpose: 'Evaluates student answers against model answers with detailed scoring' },
  { id: PLAGIARISM_AGENT_ID, name: 'Plagiarism Detector', purpose: 'Checks submissions for similarity and potential plagiarism' },
  { id: REPORT_AGENT_ID, name: 'Report Generator', purpose: 'Generates detailed performance reports with downloadable files' },
];

// Parse agent response safely
export function parseAgentResponse(result: any) {
  try {
    const rawResult = result?.response?.result;
    if (!rawResult) return null;
    if (typeof rawResult === 'string') {
      return JSON.parse(rawResult);
    }
    if (typeof rawResult === 'object') {
      return rawResult;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse agent response:', e);
    return null;
  }
}

// Default rubric
export const DEFAULT_RUBRIC: RubricCriteria = {
  semantic_similarity: 30,
  keyword_coverage: 20,
  concept_accuracy: 25,
  completeness: 15,
  structure: 10,
};

// Mock users
export const MOCK_USERS: MockUser[] = [
  { id: 'T001', name: 'Dr. Sarah Johnson', role: 'teacher', email: 'sarah.johnson@university.edu', department: 'Computer Science' },
  { id: 'T002', name: 'Prof. Michael Chen', role: 'teacher', email: 'michael.chen@university.edu', department: 'Mathematics' },
  { id: 'S001', name: 'Alice Thompson', role: 'student', email: 'alice.t@student.edu' },
  { id: 'S002', name: 'Bob Martinez', role: 'student', email: 'bob.m@student.edu' },
  { id: 'S003', name: 'Carol Williams', role: 'student', email: 'carol.w@student.edu' },
  { id: 'S004', name: 'David Lee', role: 'student', email: 'david.l@student.edu' },
  { id: 'S005', name: 'Emma Davis', role: 'student', email: 'emma.d@student.edu' },
  { id: 'A001', name: 'Admin User', role: 'admin', email: 'admin@university.edu' },
];

// Sample assignments for demo
export const SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ASG001',
    title: 'Data Structures Midterm',
    subject: 'Computer Science',
    course: 'CS201',
    section: 'A',
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'Dr. Sarah Johnson',
    rubric: DEFAULT_RUBRIC,
    questions: [
      {
        id: 'Q1',
        questionText: 'Explain the difference between a stack and a queue with examples.',
        modelAnswer: 'A stack follows LIFO (Last In First Out) principle where the last element added is the first to be removed. Example: undo operations in text editors. A queue follows FIFO (First In First Out) principle where the first element added is the first to be removed. Example: print job scheduling. Key operations for stack are push and pop, while queue uses enqueue and dequeue.',
        maxMarks: 10,
        keywords: ['LIFO', 'FIFO', 'push', 'pop', 'enqueue', 'dequeue', 'stack', 'queue'],
      },
      {
        id: 'Q2',
        questionText: 'What is the time complexity of binary search and why?',
        modelAnswer: 'Binary search has a time complexity of O(log n) because it divides the search space in half with each comparison. It requires a sorted array. At each step, the algorithm compares the target with the middle element and eliminates half of the remaining elements. The maximum number of comparisons is log2(n), making it much more efficient than linear search O(n) for large datasets.',
        maxMarks: 8,
        keywords: ['O(log n)', 'sorted', 'divide', 'half', 'comparison', 'middle element', 'binary search', 'logarithmic'],
      },
      {
        id: 'Q3',
        questionText: 'Describe the concept of recursion and provide a use case.',
        modelAnswer: 'Recursion is a programming technique where a function calls itself to solve a problem. It requires a base case to stop the recursion and a recursive case that reduces the problem. Use case: calculating factorial - factorial(n) = n * factorial(n-1) with base case factorial(0) = 1. Other examples include tree traversal, Fibonacci sequence, and divide-and-conquer algorithms.',
        maxMarks: 7,
        keywords: ['self-referencing', 'base case', 'recursive case', 'factorial', 'function calls itself', 'recursion'],
      },
    ],
  },
  {
    id: 'ASG002',
    title: 'Database Systems Quiz',
    subject: 'Computer Science',
    course: 'CS301',
    section: 'B',
    createdAt: '2025-01-20T14:00:00Z',
    createdBy: 'Prof. Michael Chen',
    rubric: DEFAULT_RUBRIC,
    questions: [
      {
        id: 'Q1',
        questionText: 'Explain the ACID properties of database transactions.',
        modelAnswer: 'ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity ensures all operations in a transaction complete or none do. Consistency ensures database moves from one valid state to another. Isolation ensures concurrent transactions do not interfere. Durability ensures committed transactions persist even after system failures.',
        maxMarks: 10,
        keywords: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'transaction', 'ACID'],
      },
      {
        id: 'Q2',
        questionText: 'What is normalization? Explain up to 3NF.',
        modelAnswer: 'Normalization is the process of organizing data to reduce redundancy and improve data integrity. 1NF: Eliminate repeating groups, ensure atomic values. 2NF: Must be in 1NF and all non-key attributes fully depend on the primary key. 3NF: Must be in 2NF and no transitive dependencies exist.',
        maxMarks: 10,
        keywords: ['normalization', 'redundancy', '1NF', '2NF', '3NF', 'atomic', 'primary key', 'transitive dependency'],
      },
    ],
  },
];

// Sample submissions for demo
export const SAMPLE_SUBMISSIONS: Submission[] = [
  {
    id: 'SUB001',
    assignmentId: 'ASG001',
    studentInfo: { name: 'Alice Thompson', studentId: 'S001', section: 'A' },
    answers: [
      'A stack is LIFO meaning last in first out. You push elements on top and pop them off. Like a stack of plates. A queue is FIFO - first in first out. You enqueue at the back and dequeue from the front. Like a line at a store.',
      'Binary search is O(log n) because it splits the array in half each time. You look at the middle element and if the target is bigger you search the right half, otherwise the left half. The array must be sorted first.',
      'Recursion is when a function calls itself. You need a base case so it stops. For example factorial: fact(5) = 5 * fact(4) = 5 * 4 * fact(3)... until fact(0) = 1.',
    ],
    gradingResult: {
      grading_results: [
        {
          question_number: 1,
          question_text: 'Explain the difference between a stack and a queue with examples.',
          marks_awarded: 8,
          max_marks: 10,
          percentage: 80,
          justification: 'Good explanation of both data structures with correct terminology. Could include more real-world examples.',
          keyword_coverage: { matched_keywords: ['LIFO', 'FIFO', 'push', 'pop', 'enqueue', 'dequeue', 'stack', 'queue'], missing_keywords: [], coverage_percentage: 100 },
          missing_points: ['Could mention more applications'],
          strengths: ['Clear comparison', 'Correct terminology', 'Good examples'],
          improvement_suggestions: ['Add complexity analysis', 'Mention implementation details'],
          concept_accuracy: 'High',
          completeness: 'Good',
          structure_quality: 'Well-organized',
        },
        {
          question_number: 2,
          question_text: 'What is the time complexity of binary search and why?',
          marks_awarded: 7,
          max_marks: 8,
          percentage: 87.5,
          justification: 'Excellent explanation of binary search complexity with clear reasoning.',
          keyword_coverage: { matched_keywords: ['O(log n)', 'sorted', 'half', 'middle element', 'binary search'], missing_keywords: ['divide', 'comparison', 'logarithmic'], coverage_percentage: 62.5 },
          missing_points: ['Could explain logarithmic growth mathematically'],
          strengths: ['Clear step-by-step explanation', 'Mentioned sorting requirement'],
          improvement_suggestions: ['Include mathematical proof', 'Compare with linear search explicitly'],
          concept_accuracy: 'High',
          completeness: 'Good',
          structure_quality: 'Good',
        },
        {
          question_number: 3,
          question_text: 'Describe the concept of recursion and provide a use case.',
          marks_awarded: 6,
          max_marks: 7,
          percentage: 85.7,
          justification: 'Good understanding of recursion with a valid example.',
          keyword_coverage: { matched_keywords: ['base case', 'factorial', 'function calls itself'], missing_keywords: ['self-referencing', 'recursive case', 'recursion'], coverage_percentage: 50 },
          missing_points: ['Could mention stack overflow risks'],
          strengths: ['Clear factorial example', 'Mentioned base case'],
          improvement_suggestions: ['Discuss advantages and disadvantages', 'Mention tail recursion'],
          concept_accuracy: 'High',
          completeness: 'Adequate',
          structure_quality: 'Good',
        },
      ],
      total_marks_awarded: 21,
      total_max_marks: 25,
      overall_percentage: 84,
      overall_grade: 'A-',
      overall_feedback: 'Strong understanding of fundamental data structures and algorithms. Demonstrates clear conceptual knowledge with good examples.',
      performance_category: 'Excellent',
    },
    plagiarismResult: null,
    reportResult: null,
    reportFiles: [],
    submittedAt: '2025-01-16T09:30:00Z',
    status: 'graded',
  },
  {
    id: 'SUB002',
    assignmentId: 'ASG001',
    studentInfo: { name: 'Bob Martinez', studentId: 'S002', section: 'A' },
    answers: [
      'Stack and queue are data structures. Stack uses LIFO and queue uses FIFO.',
      'Binary search is fast, O(log n).',
      'Recursion means a function calls itself repeatedly until a condition is met.',
    ],
    gradingResult: {
      grading_results: [
        {
          question_number: 1,
          question_text: 'Explain the difference between a stack and a queue with examples.',
          marks_awarded: 4,
          max_marks: 10,
          percentage: 40,
          justification: 'Brief answer lacking depth. No examples provided. Missing key operations.',
          keyword_coverage: { matched_keywords: ['LIFO', 'FIFO', 'stack', 'queue'], missing_keywords: ['push', 'pop', 'enqueue', 'dequeue'], coverage_percentage: 50 },
          missing_points: ['No examples', 'Missing operations', 'No applications mentioned'],
          strengths: ['Correctly identified LIFO and FIFO'],
          improvement_suggestions: ['Provide detailed examples', 'Explain operations', 'Compare implementation'],
          concept_accuracy: 'Moderate',
          completeness: 'Insufficient',
          structure_quality: 'Poor',
        },
        {
          question_number: 2,
          question_text: 'What is the time complexity of binary search and why?',
          marks_awarded: 2,
          max_marks: 8,
          percentage: 25,
          justification: 'Correct answer but no explanation of why O(log n).',
          keyword_coverage: { matched_keywords: ['O(log n)', 'binary search'], missing_keywords: ['sorted', 'divide', 'half', 'comparison', 'middle element', 'logarithmic'], coverage_percentage: 25 },
          missing_points: ['No explanation of mechanism', 'No mention of sorted requirement'],
          strengths: ['Correct complexity stated'],
          improvement_suggestions: ['Explain the divide-and-conquer approach', 'Mention prerequisites'],
          concept_accuracy: 'Low',
          completeness: 'Insufficient',
          structure_quality: 'Poor',
        },
        {
          question_number: 3,
          question_text: 'Describe the concept of recursion and provide a use case.',
          marks_awarded: 3,
          max_marks: 7,
          percentage: 42.8,
          justification: 'Basic understanding shown but no concrete use case provided.',
          keyword_coverage: { matched_keywords: ['function calls itself'], missing_keywords: ['self-referencing', 'base case', 'recursive case', 'factorial', 'recursion'], coverage_percentage: 16.7 },
          missing_points: ['No specific use case', 'No mention of base case explicitly'],
          strengths: ['Basic concept understood'],
          improvement_suggestions: ['Provide a code example', 'Explain base and recursive cases'],
          concept_accuracy: 'Moderate',
          completeness: 'Insufficient',
          structure_quality: 'Needs improvement',
        },
      ],
      total_marks_awarded: 9,
      total_max_marks: 25,
      overall_percentage: 36,
      overall_grade: 'D',
      overall_feedback: 'Answers are too brief and lack depth. While basic concepts are understood, detailed explanations with examples are needed.',
      performance_category: 'Below Average',
    },
    plagiarismResult: null,
    reportResult: null,
    reportFiles: [],
    submittedAt: '2025-01-16T11:00:00Z',
    status: 'graded',
  },
];

// Grade color helpers
export function getGradeColor(grade: string): string {
  const g = (grade || '').toUpperCase();
  if (g.startsWith('A')) return 'text-emerald-600';
  if (g.startsWith('B')) return 'text-blue-600';
  if (g.startsWith('C')) return 'text-amber-600';
  if (g.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

export function getGradeBgColor(grade: string): string {
  const g = (grade || '').toUpperCase();
  if (g.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
  if (g.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (g.startsWith('C')) return 'bg-amber-100 text-amber-700';
  if (g.startsWith('D')) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export function getPercentageColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-blue-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getRiskColor(risk: string): string {
  const r = (risk || '').toLowerCase();
  if (r === 'low') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (r === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
