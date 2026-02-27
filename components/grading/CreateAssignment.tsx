'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FiPlus, FiTrash2, FiBook, FiSave, FiCheck } from 'react-icons/fi';
import type { Assignment, Question, RubricCriteria } from './types';
import { DEFAULT_RUBRIC, generateId } from './constants';

interface CreateAssignmentProps {
  onSave: (assignment: Assignment) => void;
}

export default function CreateAssignment({ onSave }: CreateAssignmentProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: generateId(), questionText: '', modelAnswer: '', maxMarks: 10, keywords: [] },
  ]);
  const [rubric, setRubric] = useState<RubricCriteria>({ ...DEFAULT_RUBRIC });
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    const newQ: Question = { id: generateId(), questionText: '', modelAnswer: '', maxMarks: 10, keywords: [] };
    setQuestions((prev) => [...prev, newQ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateRubric = (field: keyof RubricCriteria, value: number) => {
    setRubric((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeywordsChange = (qId: string, value: string) => {
    setKeywordInputs((prev) => ({ ...prev, [qId]: value }));
    const kws = value.split(',').map((k) => k.trim()).filter(Boolean);
    updateQuestion(qId, 'keywords', kws);
  };

  const handleSave = () => {
    setError('');
    if (!title.trim() || !subject.trim() || !course.trim()) {
      setError('Please fill in assignment title, subject, and course.');
      return;
    }
    const hasEmptyQ = questions.some((q) => !q.questionText.trim() || !q.modelAnswer.trim());
    if (hasEmptyQ) {
      setError('All questions must have question text and a model answer.');
      return;
    }
    const total = rubric.semantic_similarity + rubric.keyword_coverage + rubric.concept_accuracy + rubric.completeness + rubric.structure;
    if (total !== 100) {
      setError(`Rubric weights must total 100%. Current total: ${total}%`);
      return;
    }

    const assignment: Assignment = {
      id: 'ASG' + generateId(),
      title: title.trim(),
      subject: subject.trim(),
      course: course.trim(),
      section: section.trim() || 'A',
      questions,
      rubric,
      createdAt: new Date().toISOString(),
      createdBy: 'Dr. Sarah Johnson',
    };

    onSave(assignment);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Reset
    setTitle('');
    setSubject('');
    setCourse('');
    setSection('');
    setQuestions([{ id: generateId(), questionText: '', modelAnswer: '', maxMarks: 10, keywords: [] }]);
    setKeywordInputs({});
    setRubric({ ...DEFAULT_RUBRIC });
  };

  const rubricTotal = rubric.semantic_similarity + rubric.keyword_coverage + rubric.concept_accuracy + rubric.completeness + rubric.structure;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FiBook className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Create New Assignment</CardTitle>
          </div>
          <CardDescription>Define questions, model answers, and grading rubric</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input id="title" placeholder="e.g., Midterm Exam" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" placeholder="e.g., Computer Science" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course">Course Code *</Label>
              <Input id="course" placeholder="e.g., CS201" value={course} onChange={(e) => setCourse(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section">Section</Label>
              <Input id="section" placeholder="e.g., A" value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-700">Questions ({questions.length})</h3>
              <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
                <FiPlus className="w-3.5 h-3.5" /> Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={q.id} className="border-slate-200 bg-slate-50/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-indigo-600">Question {idx + 1}</span>
                      {questions.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Question Text *</Label>
                      <Textarea placeholder="Enter the question..." value={q.questionText} onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model Answer *</Label>
                      <Textarea placeholder="Enter the ideal answer..." value={q.modelAnswer} onChange={(e) => updateQuestion(q.id, 'modelAnswer', e.target.value)} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Max Marks</Label>
                        <Input type="number" min={1} max={100} value={q.maxMarks} onChange={(e) => updateQuestion(q.id, 'maxMarks', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Keywords (comma-separated)</Label>
                        <Input placeholder="e.g., LIFO, FIFO, stack" value={keywordInputs[q.id] ?? q.keywords.join(', ')} onChange={(e) => handleKeywordsChange(q.id, e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rubric */}
          <div>
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Grading Rubric (Weights must total 100%)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {([
                { key: 'semantic_similarity' as const, label: 'Semantic Similarity' },
                { key: 'keyword_coverage' as const, label: 'Keyword Coverage' },
                { key: 'concept_accuracy' as const, label: 'Concept Accuracy' },
                { key: 'completeness' as const, label: 'Completeness' },
                { key: 'structure' as const, label: 'Structure' },
              ]).map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <Label className="text-xs">{c.label}</Label>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} max={100} value={rubric[c.key]} onChange={(e) => updateRubric(c.key, parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-xs mt-2 ${rubricTotal === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
              Total: {rubricTotal}% {rubricTotal === 100 ? '(Valid)' : '(Must be 100%)'}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md flex items-center gap-1.5"><FiCheck className="w-4 h-4" /> Assignment saved successfully!</p>}

          <Button onClick={handleSave} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <FiSave className="w-4 h-4" /> Save Assignment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
