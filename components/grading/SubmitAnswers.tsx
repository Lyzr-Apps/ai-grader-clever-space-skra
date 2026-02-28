'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiSend, FiLoader, FiAlertTriangle, FiCheck, FiUpload } from 'react-icons/fi';
import { callAIAgent } from '@/lib/aiAgent';
import type { Assignment, Submission, StudentInfo, GradingResponse } from './types';
import { GRADING_AGENT_ID, parseAgentResponse, generateId } from './constants';
import PdfUploader from './PdfUploader';

interface SubmitAnswersProps {
  assignments: Assignment[];
  onSubmissionGraded: (submission: Submission) => void;
  onActiveAgent: (agentId: string | null) => void;
}

export default function SubmitAnswers({ assignments, onSubmissionGraded, onActiveAgent }: SubmitAnswersProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ name: '', studentId: '', section: '' });
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'pdf'>('manual');
  const [pdfApplied, setPdfApplied] = useState(false);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const handleAssignmentSelect = (id: string) => {
    setSelectedAssignmentId(id);
    const asg = assignments.find((a) => a.id === id);
    if (asg) {
      setAnswers(asg.questions.map(() => ''));
    }
    setSubmitted(false);
    setLastSubmission(null);
    setError('');
    setPdfApplied(false);
  };

  const handlePdfExtracted = (extractedAnswers: string[]) => {
    setAnswers(extractedAnswers);
    setPdfApplied(true);
    setError('');
  };

  const updateAnswer = (idx: number, value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    if (!studentInfo.name.trim() || !studentInfo.studentId.trim()) {
      setError('Please enter your name and student ID.');
      return;
    }
    const hasEmpty = answers.some((a) => !a.trim());
    if (hasEmpty) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setError('');
    setLoading(true);
    onActiveAgent(GRADING_AGENT_ID);

    try {
      const message = JSON.stringify({
        student_answers: selectedAssignment.questions.map((q, i) => ({
          question_number: i + 1,
          question_text: q.questionText,
          student_answer: answers[i],
        })),
        model_answers: selectedAssignment.questions.map((q, i) => ({
          question_number: i + 1,
          question_text: q.questionText,
          model_answer: q.modelAnswer,
          max_marks: q.maxMarks,
          keywords: q.keywords,
        })),
        rubric: {
          grading_criteria: ['semantic_similarity', 'keyword_coverage', 'concept_accuracy', 'completeness', 'structure'],
          marking_scheme: 'proportional',
        },
      });

      const result = await callAIAgent(message, GRADING_AGENT_ID);

      if (result.success) {
        const data = parseAgentResponse(result) as GradingResponse | null;
        if (data) {
          const submission: Submission = {
            id: 'SUB' + generateId(),
            assignmentId: selectedAssignment.id,
            studentInfo: { ...studentInfo, section: studentInfo.section || selectedAssignment.section },
            answers: [...answers],
            gradingResult: data,
            plagiarismResult: null,
            reportResult: null,
            reportFiles: [],
            submittedAt: new Date().toISOString(),
            status: 'graded',
          };
          setLastSubmission(submission);
          onSubmissionGraded(submission);
          setSubmitted(true);
        } else {
          setError('Failed to parse grading results. Please try again.');
        }
      } else {
        setError(result?.error ?? 'Grading failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      onActiveAgent(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FiSend className="w-5 h-5 text-indigo-600" />
            Submit Answer Sheet
          </CardTitle>
          <CardDescription>Select an assignment, type your answers or upload a PDF answer sheet, and submit for AI-powered grading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Assignment Selection */}
          <div className="space-y-1.5">
            <Label>Select Assignment</Label>
            <Select value={selectedAssignmentId} onValueChange={handleAssignmentSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assignment..." />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} - {a.course} ({a.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAssignment && (
            <>
              {/* Student Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Your Name *</Label>
                  <Input placeholder="Full name" value={studentInfo.name} onChange={(e) => setStudentInfo((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Student ID *</Label>
                  <Input placeholder="e.g., S001" value={studentInfo.studentId} onChange={(e) => setStudentInfo((prev) => ({ ...prev, studentId: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Section</Label>
                  <Input placeholder={selectedAssignment.section} value={studentInfo.section} onChange={(e) => setStudentInfo((prev) => ({ ...prev, section: e.target.value }))} />
                </div>
              </div>

              {/* Assignment Info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{selectedAssignment.subject}</Badge>
                <Badge variant="outline">{selectedAssignment.course}</Badge>
                <Badge variant="outline">{selectedAssignment.questions.length} Questions</Badge>
                <Badge variant="outline">
                  Total: {selectedAssignment.questions.reduce((s, q) => s + q.maxMarks, 0)} marks
                </Badge>
              </div>

              {/* Input Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  disabled={loading || submitted}
                >
                  Type Answers
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('pdf')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    inputMode === 'pdf'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  disabled={loading || submitted}
                >
                  <FiUpload className="w-3.5 h-3.5" /> Upload PDF
                </button>
              </div>

              {/* PDF Upload Section */}
              {inputMode === 'pdf' && (
                <PdfUploader
                  questionCount={selectedAssignment.questions.length}
                  questionTexts={selectedAssignment.questions.map((q) => q.questionText)}
                  onExtracted={handlePdfExtracted}
                  disabled={loading || submitted}
                />
              )}

              {/* PDF Applied Info */}
              {pdfApplied && inputMode === 'pdf' && (
                <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md">
                  PDF answers have been applied to the fields below. Review and edit if needed before submitting.
                </p>
              )}

              {/* Questions */}
              <div className="space-y-4">
                {selectedAssignment.questions.map((q, idx) => (
                  <Card key={q.id} className="border-slate-200 bg-slate-50/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-600">Question {idx + 1}</span>
                        <Badge variant="outline" className="text-xs">{q.maxMarks} marks</Badge>
                      </div>
                      <p className="text-sm text-slate-700">{q.questionText}</p>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[idx] ?? ''}
                        onChange={(e) => updateAnswer(idx, e.target.value)}
                        rows={4}
                        disabled={loading || submitted}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md flex items-center gap-1.5">
                  <FiAlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </p>
              )}

              {submitted && lastSubmission?.gradingResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Graded Successfully!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {lastSubmission.gradingResult.total_marks_awarded}/{lastSubmission.gradingResult.total_max_marks}
                      </div>
                      <div className="text-xs text-emerald-600">Total Marks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {lastSubmission.gradingResult.overall_percentage}%
                      </div>
                      <div className="text-xs text-emerald-600">Percentage</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {lastSubmission.gradingResult.overall_grade}
                      </div>
                      <div className="text-xs text-emerald-600">Grade</div>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700 mt-2">View detailed results in the "My Results" tab.</p>
                </div>
              )}

              {!submitted && (
                <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                  {loading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" /> Grading in progress...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" /> Submit & Grade
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
