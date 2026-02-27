'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FiEye, FiList } from 'react-icons/fi';
import type { Submission, Assignment } from './types';
import { getGradeBgColor } from './constants';

interface SubmissionsListProps {
  submissions: Submission[];
  assignments: Assignment[];
  onViewDetails: (submission: Submission) => void;
  showAllActions?: boolean;
}

export default function SubmissionsList({ submissions, assignments, onViewDetails, showAllActions }: SubmissionsListProps) {
  const getAssignmentTitle = (assignmentId: string): string => {
    const asg = assignments.find((a) => a.id === assignmentId);
    return asg?.title ?? 'Unknown Assignment';
  };

  if (submissions.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          <FiList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm mt-1">Submissions will appear here once students submit their answers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FiList className="w-5 h-5 text-indigo-600" />
          Submissions ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Assignment</TableHead>
                <TableHead className="text-xs">Score</TableHead>
                <TableHead className="text-xs">Grade</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Submitted</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const gr = sub.gradingResult;
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">
                      <div>
                        <div className="font-medium text-slate-700">{sub.studentInfo?.name ?? 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{sub.studentInfo?.studentId ?? ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{getAssignmentTitle(sub.assignmentId)}</TableCell>
                    <TableCell className="text-sm">
                      {gr ? (
                        <span className="font-medium">{gr.total_marks_awarded ?? 0}/{gr.total_max_marks ?? 0}</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {gr ? (
                        <Badge className={`text-xs ${getGradeBgColor(gr.overall_grade ?? '')}`}>
                          {gr.overall_grade ?? 'N/A'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'graded' ? 'default' : sub.status === 'reviewed' ? 'secondary' : 'outline'} className="text-xs capitalize">
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetails(sub)} className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700">
                          <FiEye className="w-3.5 h-3.5" /> View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
