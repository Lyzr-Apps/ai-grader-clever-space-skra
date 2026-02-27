'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FiBook, FiAward, FiShield, FiFileText, FiBarChart2, FiSend, FiList, FiActivity } from 'react-icons/fi';
import type { UserRole, Assignment, Submission, PlagiarismResponse, ReportResponse, ArtifactFile } from '@/components/grading/types';
import { AGENTS, SAMPLE_ASSIGNMENTS, SAMPLE_SUBMISSIONS } from '@/components/grading/constants';
import RoleSelector from '@/components/grading/RoleSelector';
import CreateAssignment from '@/components/grading/CreateAssignment';
import SubmitAnswers from '@/components/grading/SubmitAnswers';
import GradingResults from '@/components/grading/GradingResults';
import PlagiarismCheck from '@/components/grading/PlagiarismCheck';
import ReportGenerator from '@/components/grading/ReportGenerator';
import TeacherDashboard from '@/components/grading/TeacherDashboard';
import AdminDashboard from '@/components/grading/AdminDashboard';
import SubmissionsList from '@/components/grading/SubmissionsList';

// ErrorBoundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const THEME_VARS = {
  '--background': '210 40% 98%',
  '--foreground': '222 47% 11%',
  '--card': '0 0% 100%',
  '--card-foreground': '222 47% 11%',
  '--primary': '239 84% 67%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '210 40% 96%',
  '--secondary-foreground': '222 47% 11%',
  '--muted': '210 40% 96%',
  '--muted-foreground': '215 16% 47%',
  '--accent': '210 40% 96%',
  '--accent-foreground': '222 47% 11%',
  '--border': '214 32% 91%',
  '--input': '214 32% 91%',
  '--ring': '239 84% 67%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
} as React.CSSProperties;

export default function Page() {
  const [role, setRole] = useState<UserRole>('student');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sampleDataOn, setSampleDataOn] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [studentTab, setStudentTab] = useState('assignments');
  const [teacherTab, setTeacherTab] = useState('create');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem('grading_assignments');
      const savedSubmissions = localStorage.getItem('grading_submissions');
      if (savedAssignments) setAssignments(JSON.parse(savedAssignments));
      if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('grading_assignments', JSON.stringify(assignments));
    } catch (e) { /* ignore */ }
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem('grading_submissions', JSON.stringify(submissions));
    } catch (e) { /* ignore */ }
  }, [submissions]);

  // Toggle sample data
  useEffect(() => {
    if (sampleDataOn) {
      setAssignments((prev) => {
        const sampleIds = SAMPLE_ASSIGNMENTS.map((a) => a.id);
        const existing = prev.filter((a) => !sampleIds.includes(a.id));
        return [...SAMPLE_ASSIGNMENTS, ...existing];
      });
      setSubmissions((prev) => {
        const sampleIds = SAMPLE_SUBMISSIONS.map((s) => s.id);
        const existing = prev.filter((s) => !sampleIds.includes(s.id));
        return [...SAMPLE_SUBMISSIONS, ...existing];
      });
    } else {
      setAssignments((prev) => {
        const sampleIds = SAMPLE_ASSIGNMENTS.map((a) => a.id);
        return prev.filter((a) => !sampleIds.includes(a.id));
      });
      setSubmissions((prev) => {
        const sampleIds = SAMPLE_SUBMISSIONS.map((s) => s.id);
        return prev.filter((s) => !sampleIds.includes(s.id));
      });
      setSelectedSubmission(null);
    }
  }, [sampleDataOn]);

  const handleSaveAssignment = useCallback((assignment: Assignment) => {
    setAssignments((prev) => [...prev, assignment]);
  }, []);

  const handleSubmissionGraded = useCallback((submission: Submission) => {
    setSubmissions((prev) => [...prev, submission]);
    setSelectedSubmission(submission);
    setStudentTab('results');
  }, []);

  const handlePlagiarismResult = useCallback((submissionId: string, result: PlagiarismResponse) => {
    setSubmissions((prev) => prev.map((s) => s.id === submissionId ? { ...s, plagiarismResult: result } : s));
    setSelectedSubmission((prev) => prev?.id === submissionId ? { ...prev, plagiarismResult: result } : prev);
  }, []);

  const handleReportResult = useCallback((submissionId: string, result: ReportResponse, files: ArtifactFile[]) => {
    setSubmissions((prev) => prev.map((s) => s.id === submissionId ? { ...s, reportResult: result, reportFiles: files } : s));
    setSelectedSubmission((prev) => prev?.id === submissionId ? { ...prev, reportResult: result, reportFiles: files } : prev);
  }, []);

  const handleUpdateSubmission = useCallback((updated: Submission) => {
    setSubmissions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setSelectedSubmission((prev) => prev?.id === updated.id ? updated : prev);
  }, []);

  const handleViewDetails = useCallback((submission: Submission) => {
    setSelectedSubmission(submission);
    if (role === 'teacher') setTeacherTab('submissions');
  }, [role]);

  const selectedAssignment = assignments.find((a) => a.id === selectedSubmission?.assignmentId) ?? null;

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <FiAward className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">AutoGrade AI</h1>
                  <p className="text-xs text-slate-500">AI-Powered Assignment Grading System</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Sample Data Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-slate-500 cursor-pointer">Sample Data</Label>
                  <Switch id="sample-toggle" checked={sampleDataOn} onCheckedChange={setSampleDataOn} />
                </div>
                <Separator orientation="vertical" className="h-6" />
                {/* Role Selector */}
                <RoleSelector role={role} onRoleChange={setRole} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Student View */}
          {role === 'student' && (
            <Tabs value={studentTab} onValueChange={setStudentTab} className="w-full">
              <TabsList className="mb-6 w-full justify-start bg-white border border-slate-200 shadow-sm p-1">
                <TabsTrigger value="assignments" className="gap-1.5 text-sm"><FiBook className="w-3.5 h-3.5" /> My Assignments</TabsTrigger>
                <TabsTrigger value="submit" className="gap-1.5 text-sm"><FiSend className="w-3.5 h-3.5" /> Submit Answers</TabsTrigger>
                <TabsTrigger value="results" className="gap-1.5 text-sm"><FiAward className="w-3.5 h-3.5" /> My Results</TabsTrigger>
              </TabsList>

              {/* My Assignments */}
              <TabsContent value="assignments">
                {assignments.length === 0 ? (
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8 text-center text-slate-500">
                      <FiBook className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No assignments available</p>
                      <p className="text-sm mt-1">Turn on Sample Data to see example assignments, or ask your teacher to create one.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((asg) => {
                      const totalMarks = asg.questions.reduce((s, q) => s + q.maxMarks, 0);
                      const mySubs = submissions.filter((s) => s.assignmentId === asg.id);
                      return (
                        <Card key={asg.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{asg.title}</CardTitle>
                                <CardDescription className="mt-0.5">{asg.subject} - {asg.course}</CardDescription>
                              </div>
                              {mySubs.length > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Submitted</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              <Badge variant="outline" className="text-xs">{asg.questions.length} Questions</Badge>
                              <Badge variant="outline" className="text-xs">{totalMarks} Marks</Badge>
                              <Badge variant="outline" className="text-xs">Section {asg.section}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setStudentTab('submit')} className="text-xs gap-1 bg-indigo-600 hover:bg-indigo-700">
                                <FiSend className="w-3 h-3" /> {mySubs.length > 0 ? 'Resubmit' : 'Start'}
                              </Button>
                              {mySubs.length > 0 && mySubs[0]?.gradingResult && (
                                <Button size="sm" variant="outline" onClick={() => { setSelectedSubmission(mySubs[0]); setStudentTab('results'); }} className="text-xs gap-1">
                                  <FiAward className="w-3 h-3" /> View Result
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Submit Answers */}
              <TabsContent value="submit">
                <SubmitAnswers
                  assignments={assignments}
                  onSubmissionGraded={handleSubmissionGraded}
                  onActiveAgent={setActiveAgentId}
                />
              </TabsContent>

              {/* My Results */}
              <TabsContent value="results">
                <div className="space-y-6">
                  {/* Submission Selector */}
                  {submissions.filter((s) => s.gradingResult !== null).length > 1 && (
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <Label className="text-sm text-slate-600 mb-2 block">Select Submission</Label>
                        <div className="flex flex-wrap gap-2">
                          {submissions.filter((s) => s.gradingResult !== null).map((sub) => {
                            const asg = assignments.find((a) => a.id === sub.assignmentId);
                            return (
                              <Button
                                key={sub.id}
                                size="sm"
                                variant={selectedSubmission?.id === sub.id ? 'default' : 'outline'}
                                onClick={() => setSelectedSubmission(sub)}
                                className={`text-xs ${selectedSubmission?.id === sub.id ? 'bg-indigo-600' : ''}`}
                              >
                                {asg?.title ?? 'Unknown'} - {sub.studentInfo?.name ?? ''}
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Results Tabs */}
                  {selectedSubmission?.gradingResult ? (
                    <Tabs defaultValue="grades" className="w-full">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="grades" className="gap-1.5 text-sm"><FiAward className="w-3.5 h-3.5" /> Grades</TabsTrigger>
                        <TabsTrigger value="plagiarism" className="gap-1.5 text-sm"><FiShield className="w-3.5 h-3.5" /> Plagiarism</TabsTrigger>
                        <TabsTrigger value="report" className="gap-1.5 text-sm"><FiFileText className="w-3.5 h-3.5" /> Report</TabsTrigger>
                      </TabsList>

                      <TabsContent value="grades" className="mt-4">
                        <GradingResults submission={selectedSubmission} />
                      </TabsContent>

                      <TabsContent value="plagiarism" className="mt-4">
                        <PlagiarismCheck
                          submission={selectedSubmission}
                          allSubmissions={submissions}
                          onResult={handlePlagiarismResult}
                          onActiveAgent={setActiveAgentId}
                        />
                      </TabsContent>

                      <TabsContent value="report" className="mt-4">
                        <ReportGenerator
                          submission={selectedSubmission}
                          assignment={selectedAssignment}
                          onResult={handleReportResult}
                          onActiveAgent={setActiveAgentId}
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-8 text-center text-slate-500">
                        <FiAward className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">No results to display</p>
                        <p className="text-sm mt-1">Submit and grade an assignment to see your results here.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Teacher View */}
          {role === 'teacher' && (
            <Tabs value={teacherTab} onValueChange={setTeacherTab} className="w-full">
              <TabsList className="mb-6 w-full justify-start bg-white border border-slate-200 shadow-sm p-1">
                <TabsTrigger value="create" className="gap-1.5 text-sm"><FiBook className="w-3.5 h-3.5" /> Create Assignment</TabsTrigger>
                <TabsTrigger value="submissions" className="gap-1.5 text-sm"><FiList className="w-3.5 h-3.5" /> Submissions</TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5 text-sm"><FiBarChart2 className="w-3.5 h-3.5" /> Class Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <CreateAssignment onSave={handleSaveAssignment} />
              </TabsContent>

              <TabsContent value="submissions">
                <div className="space-y-6">
                  <SubmissionsList
                    submissions={submissions}
                    assignments={assignments}
                    onViewDetails={handleViewDetails}
                    showAllActions
                  />

                  {/* Detail view when a submission is selected */}
                  {selectedSubmission?.gradingResult && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <FiAward className="w-4 h-4 text-indigo-600" />
                        Details: {selectedSubmission.studentInfo?.name ?? 'Unknown Student'}
                      </h3>
                      <Tabs defaultValue="grades" className="w-full">
                        <TabsList>
                          <TabsTrigger value="grades" className="text-sm gap-1"><FiAward className="w-3.5 h-3.5" /> Grades</TabsTrigger>
                          <TabsTrigger value="plagiarism" className="text-sm gap-1"><FiShield className="w-3.5 h-3.5" /> Plagiarism</TabsTrigger>
                          <TabsTrigger value="report" className="text-sm gap-1"><FiFileText className="w-3.5 h-3.5" /> Report</TabsTrigger>
                        </TabsList>
                        <TabsContent value="grades" className="mt-4">
                          <GradingResults submission={selectedSubmission} />
                        </TabsContent>
                        <TabsContent value="plagiarism" className="mt-4">
                          <PlagiarismCheck
                            submission={selectedSubmission}
                            allSubmissions={submissions}
                            onResult={handlePlagiarismResult}
                            onActiveAgent={setActiveAgentId}
                          />
                        </TabsContent>
                        <TabsContent value="report" className="mt-4">
                          <ReportGenerator
                            submission={selectedSubmission}
                            assignment={selectedAssignment}
                            onResult={handleReportResult}
                            onActiveAgent={setActiveAgentId}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <TeacherDashboard assignments={assignments} submissions={submissions} />
              </TabsContent>
            </Tabs>
          )}

          {/* Admin View */}
          {role === 'admin' && (
            <AdminDashboard
              assignments={assignments}
              submissions={submissions}
              onUpdateSubmission={handleUpdateSubmission}
            />
          )}
        </main>

        {/* Agent Status Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
            <div className="flex items-center gap-4 overflow-x-auto">
              <span className="text-xs font-medium text-slate-500 flex-shrink-0 flex items-center gap-1">
                <FiActivity className="w-3 h-3" /> AI Agents:
              </span>
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${activeAgentId === agent.id ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={`text-xs ${activeAgentId === agent.id ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {agent.name}
                  </span>
                  <span className="text-xs text-slate-400 hidden md:inline">- {agent.purpose.length > 40 ? agent.purpose.substring(0, 40) + '...' : agent.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        </footer>

        {/* Bottom padding for footer */}
        <div className="h-12" />
      </div>
    </ErrorBoundary>
  );
}
