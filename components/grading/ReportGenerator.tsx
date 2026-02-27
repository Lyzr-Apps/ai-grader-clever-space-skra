'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiFileText, FiLoader, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { callAIAgent } from '@/lib/aiAgent';
import type { Submission, Assignment, ReportResponse, ArtifactFile } from './types';
import { REPORT_AGENT_ID, parseAgentResponse } from './constants';

interface ReportGeneratorProps {
  submission: Submission | null;
  assignment: Assignment | null;
  onResult: (submissionId: string, result: ReportResponse, files: ArtifactFile[]) => void;
  onActiveAgent: (agentId: string | null) => void;
}

export default function ReportGenerator({ submission, assignment, onResult, onActiveAgent }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!submission || !submission.gradingResult) return;
    setError('');
    setLoading(true);
    onActiveAgent(REPORT_AGENT_ID);

    try {
      const message = JSON.stringify({
        student_info: {
          name: submission.studentInfo?.name ?? '',
          student_id: submission.studentInfo?.studentId ?? '',
          course: assignment?.course ?? '',
          section: submission.studentInfo?.section ?? assignment?.section ?? '',
        },
        assignment_info: {
          title: assignment?.title ?? '',
          subject: assignment?.subject ?? '',
          date: submission.submittedAt ?? '',
          total_marks: submission.gradingResult.total_max_marks ?? 0,
        },
        grading_results: submission.gradingResult.grading_results ?? [],
        overall_scores: {
          total_marks: submission.gradingResult.total_marks_awarded ?? 0,
          percentage: submission.gradingResult.overall_percentage ?? 0,
          grade: submission.gradingResult.overall_grade ?? '',
          performance_category: submission.gradingResult.performance_category ?? '',
        },
        plagiarism_results: submission.plagiarismResult ?? null,
      });

      const result = await callAIAgent(message, REPORT_AGENT_ID);

      if (result.success) {
        const data = parseAgentResponse(result) as ReportResponse | null;
        const files: ArtifactFile[] = Array.isArray(result?.module_outputs?.artifact_files)
          ? result.module_outputs.artifact_files
          : [];
        if (data) {
          onResult(submission.id, data, files);
        } else {
          setError('Failed to parse report data.');
        }
      } else {
        setError(result?.error ?? 'Report generation failed.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      onActiveAgent(null);
    }
  };

  if (!submission) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          <FiFileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No submission selected</p>
          <p className="text-sm mt-1">Grade a submission first to generate a report.</p>
        </CardContent>
      </Card>
    );
  }

  if (!submission.gradingResult) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          <FiFileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Submission not yet graded</p>
          <p className="text-sm mt-1">The submission must be graded before generating a report.</p>
        </CardContent>
      </Card>
    );
  }

  const rr = submission.reportResult;
  const files = Array.isArray(submission.reportFiles) ? submission.reportFiles : [];

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      {!rr && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <FiFileText className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
            <h3 className="font-semibold text-slate-700 mb-1">Generate Performance Report</h3>
            <p className="text-sm text-slate-500 mb-4">
              Create a comprehensive report for {submission.studentInfo?.name ?? 'this student'}
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mb-3 flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </p>
            )}
            <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Generating Report...</>
              ) : (
                <><FiFileText className="w-4 h-4" /> Generate Report</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {rr && (
        <>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-indigo-600" />
                  {rr.report_title ?? 'Performance Report'}
                </CardTitle>
                {files.length > 0 && (
                  <div className="flex gap-2">
                    {files.map((f, i) => (
                      <a key={i} href={f.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <FiDownload className="w-3.5 h-3.5" />
                          {f.name || `Download ${f.format_type || 'file'}`}
                        </Button>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {rr.generated_at && (
                <p className="text-xs text-slate-400 mt-1">Generated: {new Date(rr.generated_at).toLocaleString()}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Executive Summary */}
              {rr.executive_summary && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 className="text-sm font-semibold text-indigo-700 mb-2">Executive Summary</h4>
                  <p className="text-sm text-indigo-600">{rr.executive_summary}</p>
                </div>
              )}

              {/* Overall Performance */}
              {rr.overall_performance && typeof rr.overall_performance === 'object' && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Overall Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(rr.overall_performance).map(([key, val]) => (
                      <div key={key} className="text-center p-2 bg-white rounded border border-slate-100">
                        <div className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-semibold text-slate-700 mt-0.5">{String(val ?? '')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Justification */}
              {rr.grade_justification && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Grade Justification</h4>
                  <p className="text-sm text-slate-600">{rr.grade_justification}</p>
                </div>
              )}

              {/* Improvement Roadmap */}
              {Array.isArray(rr.improvement_roadmap) && rr.improvement_roadmap.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">Improvement Roadmap</h4>
                  <div className="space-y-2">
                    {rr.improvement_roadmap.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Badge className="bg-blue-200 text-blue-700 text-xs mt-0.5 flex-shrink-0">{i + 1}</Badge>
                        <div className="text-blue-600">
                          {typeof item === 'object' ? (
                            Object.entries(item).map(([k, v]) => (
                              <span key={k}><strong className="capitalize">{k.replace(/_/g, ' ')}:</strong> {String(v ?? '')} </span>
                            ))
                          ) : (
                            String(item)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrity Section */}
              {rr.integrity_section && typeof rr.integrity_section === 'object' && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Academic Integrity</h4>
                  <div className="space-y-1">
                    {Object.entries(rr.integrity_section).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-700 font-medium">{String(val ?? '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Breakdown */}
              {Array.isArray(rr.question_breakdown) && rr.question_breakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Question Breakdown</h4>
                  <div className="space-y-2">
                    {rr.question_breakdown.map((qb, i) => (
                      <Card key={i} className="border-slate-200">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {typeof qb === 'object' && qb !== null && Object.entries(qb).map(([key, val]) => (
                              <div key={key}>
                                <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                <div className="text-slate-700 font-medium text-xs">
                                  {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Analytics */}
              {rr.performance_analytics && typeof rr.performance_analytics === 'object' && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Performance Analytics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(rr.performance_analytics).map(([key, val]) => (
                      <div key={key} className="text-center p-2 bg-white rounded border border-slate-100">
                        <div className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-semibold text-slate-700 mt-0.5">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Re-generate button */}
          <div className="text-center">
            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiFileText className="w-4 h-4" />}
              Regenerate Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
