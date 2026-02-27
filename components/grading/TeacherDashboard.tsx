'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiBarChart2, FiTrendingUp, FiTarget, FiUsers } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Submission, Assignment } from './types';
// constants helpers available if needed

interface TeacherDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TeacherDashboard({ assignments, submissions }: TeacherDashboardProps) {
  const gradedSubmissions = useMemo(() => {
    return submissions.filter((s) => s.gradingResult !== null);
  }, [submissions]);

  const avgPercentage = useMemo(() => {
    if (gradedSubmissions.length === 0) return 0;
    const total = gradedSubmissions.reduce((sum, s) => sum + (s.gradingResult?.overall_percentage ?? 0), 0);
    return Math.round(total / gradedSubmissions.length);
  }, [gradedSubmissions]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 };
    gradedSubmissions.forEach((s) => {
      const g = s.gradingResult?.overall_grade ?? '';
      if (g in dist) {
        dist[g]++;
      } else {
        // Map to closest
        const firstChar = g.charAt(0).toUpperCase();
        if (firstChar === 'A') dist['A']++;
        else if (firstChar === 'B') dist['B']++;
        else if (firstChar === 'C') dist['C']++;
        else if (firstChar === 'D') dist['D']++;
        else dist['F']++;
      }
    });
    return Object.entries(dist)
      .filter(([, count]) => count > 0)
      .map(([grade, count]) => ({ grade, count }));
  }, [gradedSubmissions]);

  // Performance by assignment
  const assignmentPerformance = useMemo(() => {
    return assignments.map((a) => {
      const asgSubs = gradedSubmissions.filter((s) => s.assignmentId === a.id);
      const avg = asgSubs.length > 0
        ? Math.round(asgSubs.reduce((sum, s) => sum + (s.gradingResult?.overall_percentage ?? 0), 0) / asgSubs.length)
        : 0;
      return { name: a.title.length > 20 ? a.title.substring(0, 20) + '...' : a.title, average: avg, submissions: asgSubs.length };
    });
  }, [assignments, gradedSubmissions]);

  // Most missed concepts (from missing_points)
  const missedConcepts = useMemo(() => {
    const conceptMap: Record<string, number> = {};
    gradedSubmissions.forEach((s) => {
      const results = Array.isArray(s.gradingResult?.grading_results) ? s.gradingResult.grading_results : [];
      results.forEach((qr) => {
        const missing = Array.isArray(qr.missing_points) ? qr.missing_points : [];
        missing.forEach((mp) => {
          const clean = mp.trim();
          if (clean) {
            conceptMap[clean] = (conceptMap[clean] || 0) + 1;
          }
        });
      });
    });
    return Object.entries(conceptMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([concept, count]) => ({ concept, count }));
  }, [gradedSubmissions]);

  // Keyword coverage stats
  const keywordStats = useMemo(() => {
    let totalCoverage = 0;
    let count = 0;
    gradedSubmissions.forEach((s) => {
      const results = Array.isArray(s.gradingResult?.grading_results) ? s.gradingResult.grading_results : [];
      results.forEach((qr) => {
        if (qr.keyword_coverage?.coverage_percentage != null) {
          totalCoverage += qr.keyword_coverage.coverage_percentage;
          count++;
        }
      });
    });
    return count > 0 ? Math.round(totalCoverage / count) : 0;
  }, [gradedSubmissions]);

  // Performance categories distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    gradedSubmissions.forEach((s) => {
      const cat = s.gradingResult?.performance_category ?? 'Unknown';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [gradedSubmissions]);

  if (gradedSubmissions.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          <FiBarChart2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No data available yet</p>
          <p className="text-sm mt-1">Analytics will appear after submissions are graded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <FiUsers className="w-6 h-6 mx-auto mb-1 text-indigo-500" />
            <div className="text-2xl font-bold text-slate-800">{submissions.length}</div>
            <div className="text-xs text-slate-500">Total Submissions</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <FiTrendingUp className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <div className="text-2xl font-bold text-slate-800">{avgPercentage}%</div>
            <div className="text-xs text-slate-500">Average Score</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <FiTarget className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold text-slate-800">{keywordStats}%</div>
            <div className="text-xs text-slate-500">Avg Keyword Coverage</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <FiBarChart2 className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold text-slate-800">{assignments.length}</div>
            <div className="text-xs text-slate-500">Assignments</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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

        {/* Performance Categories */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Performance Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryDistribution.map((_, i) => (
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

      {/* Assignment Performance */}
      {assignmentPerformance.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Performance by Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most Missed Concepts */}
      {missedConcepts.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Most Common Missing Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missedConcepts.map((mc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-slate-600">{mc.concept}</span>
                      <Badge variant="outline" className="text-xs">{mc.count}x</Badge>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${Math.min((mc.count / (missedConcepts[0]?.count || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
