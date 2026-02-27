'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiBarChart2, FiUsers, FiEdit, FiSearch } from 'react-icons/fi';
import type { Submission, Assignment } from './types';
import { getGradeBgColor, MOCK_USERS } from './constants';

interface AdminDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  onUpdateSubmission: (submission: Submission) => void;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard({ assignments, submissions, onUpdateSubmission }: AdminDashboardProps) {
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideDialog, setOverrideDialog] = useState<Submission | null>(null);
  const [overrideGrade, setOverrideGrade] = useState('');
  const [overrideMarks, setOverrideMarks] = useState('');

  const gradedSubs = useMemo(() => submissions.filter((s) => s.gradingResult !== null), [submissions]);

  const avgGrade = useMemo(() => {
    if (gradedSubs.length === 0) return 0;
    return Math.round(gradedSubs.reduce((s, sub) => s + (sub.gradingResult?.overall_percentage ?? 0), 0) / gradedSubs.length);
  }, [gradedSubs]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filterAssignment !== 'all' && s.assignmentId !== filterAssignment) return false;
      if (filterGrade !== 'all') {
        const grade = (s.gradingResult?.overall_grade ?? '').charAt(0).toUpperCase();
        if (filterGrade !== grade) return false;
      }
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (s.studentInfo?.name ?? '').toLowerCase().includes(q);
        const idMatch = (s.studentInfo?.studentId ?? '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch) return false;
      }
      return true;
    });
  }, [submissions, filterAssignment, filterGrade, filterStatus, searchQuery]);

  // Grade distribution for admin
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    gradedSubs.forEach((s) => {
      const g = s.gradingResult?.overall_grade ?? 'Unknown';
      dist[g] = (dist[g] || 0) + 1;
    });
    return Object.entries(dist).map(([grade, count]) => ({ grade, count }));
  }, [gradedSubs]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    submissions.forEach((s) => {
      dist[s.status] = (dist[s.status] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [submissions]);

  // Common issues
  const commonIssues = useMemo(() => {
    const issues: Record<string, number> = {};
    gradedSubs.forEach((s) => {
      const results = Array.isArray(s.gradingResult?.grading_results) ? s.gradingResult.grading_results : [];
      results.forEach((qr) => {
        const suggestions = Array.isArray(qr.improvement_suggestions) ? qr.improvement_suggestions : [];
        suggestions.forEach((sug) => {
          const clean = sug.trim();
          if (clean) issues[clean] = (issues[clean] || 0) + 1;
        });
      });
    });
    return Object.entries(issues).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([issue, count]) => ({ issue, count }));
  }, [gradedSubs]);

  const handleOverride = () => {
    if (!overrideDialog || !overrideDialog.gradingResult) return;
    const updated: Submission = {
      ...overrideDialog,
      gradingResult: {
        ...overrideDialog.gradingResult,
        overall_grade: overrideGrade || overrideDialog.gradingResult.overall_grade,
        total_marks_awarded: overrideMarks ? parseInt(overrideMarks) : overrideDialog.gradingResult.total_marks_awarded,
        overall_percentage: overrideMarks
          ? Math.round((parseInt(overrideMarks) / (overrideDialog.gradingResult.total_max_marks || 1)) * 100)
          : overrideDialog.gradingResult.overall_percentage,
      },
      status: 'reviewed',
    };
    onUpdateSubmission(updated);
    setOverrideDialog(null);
    setOverrideGrade('');
    setOverrideMarks('');
  };

  const getAssignmentTitle = (id: string) => assignments.find((a) => a.id === id)?.title ?? 'Unknown';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="submissions" className="gap-1.5"><FiSearch className="w-3.5 h-3.5" /> All Submissions</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><FiBarChart2 className="w-3.5 h-3.5" /> System Analytics</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><FiUsers className="w-3.5 h-3.5" /> User Management</TabsTrigger>
        </TabsList>

        {/* All Submissions */}
        <TabsContent value="submissions" className="space-y-4 mt-4">
          {/* Filters */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Search Student</Label>
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <Input placeholder="Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Assignment</Label>
                  <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignments</SelectItem>
                      {assignments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Grade</Label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {['A', 'B', 'C', 'D', 'F'].map((g) => (
                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Assignment</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Percentage</TableHead>
                      <TableHead className="text-xs">Grade</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-slate-400 py-8">No submissions match the filters</TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const gr = sub.gradingResult;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="text-sm">
                              <div className="font-medium text-slate-700">{sub.studentInfo?.name ?? 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{sub.studentInfo?.studentId ?? ''}</div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{getAssignmentTitle(sub.assignmentId)}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {gr ? `${gr.total_marks_awarded ?? 0}/${gr.total_max_marks ?? 0}` : '--'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {gr ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${(gr.overall_percentage ?? 0) >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(gr.overall_percentage ?? 0, 100)}%` }} />
                                  </div>
                                  <span className="text-xs">{Math.round(gr.overall_percentage ?? 0)}%</span>
                                </div>
                              ) : '--'}
                            </TableCell>
                            <TableCell>
                              {gr ? (
                                <Badge className={`text-xs ${getGradeBgColor(gr.overall_grade ?? '')}`}>{gr.overall_grade ?? '--'}</Badge>
                              ) : <Badge variant="outline" className="text-xs">--</Badge>}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{gr?.performance_category ?? '--'}</TableCell>
                            <TableCell>
                              <Badge variant={sub.status === 'graded' ? 'default' : sub.status === 'reviewed' ? 'secondary' : 'outline'} className="text-xs capitalize">{sub.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {gr && (
                                <Button variant="ghost" size="sm" onClick={() => { setOverrideDialog(sub); setOverrideGrade(gr.overall_grade ?? ''); setOverrideMarks(String(gr.total_marks_awarded ?? '')); }} className="h-7 px-2 text-xs gap-1 text-amber-600 hover:text-amber-700">
                                  <FiEdit className="w-3.5 h-3.5" /> Override
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Analytics */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{submissions.length}</div>
                <div className="text-xs text-slate-500">Total Submissions</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{avgGrade}%</div>
                <div className="text-xs text-slate-500">Average Grade</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{assignments.length}</div>
                <div className="text-xs text-slate-500">Assignments</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{gradedSubs.length}</div>
                <div className="text-xs text-slate-500">Graded</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="grade" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label>
                        {statusDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Common Issues */}
          {commonIssues.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">Most Common Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commonIssues.map((ci, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs flex-shrink-0 w-8 justify-center">{ci.count}</Badge>
                      <div className="flex-1">
                        <span className="text-sm text-slate-600">{ci.issue}</span>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                          <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${Math.min((ci.count / (commonIssues[0]?.count || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-indigo-600" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USERS.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-sm text-slate-500">{user.id}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">{user.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{user.department ?? '--'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Override Dialog */}
      <Dialog open={overrideDialog !== null} onOpenChange={() => setOverrideDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Grade</DialogTitle>
            <DialogDescription>
              Override the AI-assigned grade for {overrideDialog?.studentInfo?.name ?? 'this student'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>New Grade</Label>
              <Input placeholder="e.g., A, B+, C" value={overrideGrade} onChange={(e) => setOverrideGrade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New Marks</Label>
              <Input type="number" placeholder="e.g., 22" value={overrideMarks} onChange={(e) => setOverrideMarks(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOverrideDialog(null)}>Cancel</Button>
              <Button onClick={handleOverride} className="bg-indigo-600 hover:bg-indigo-700">Save Override</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
