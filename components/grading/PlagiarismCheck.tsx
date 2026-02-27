'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiSearch, FiLoader, FiAlertTriangle, FiShield, FiCheck } from 'react-icons/fi';
import { callAIAgent } from '@/lib/aiAgent';
import type { Submission, PlagiarismResponse } from './types';
import { PLAGIARISM_AGENT_ID, parseAgentResponse, getRiskColor } from './constants';

interface PlagiarismCheckProps {
  submission: Submission | null;
  allSubmissions: Submission[];
  onResult: (submissionId: string, result: PlagiarismResponse) => void;
  onActiveAgent: (agentId: string | null) => void;
}

export default function PlagiarismCheck({ submission, allSubmissions, onResult, onActiveAgent }: PlagiarismCheckProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!submission) return;
    setError('');
    setLoading(true);
    onActiveAgent(PLAGIARISM_AGENT_ID);

    try {
      // Get other submissions for same assignment
      const otherSubs = allSubmissions.filter(
        (s) => s.assignmentId === submission.assignmentId && s.id !== submission.id
      );

      const message = JSON.stringify({
        student_submission: {
          student_name: submission.studentInfo?.name ?? 'Unknown',
          answers: submission.answers.map((a, i) => ({
            question_number: i + 1,
            answer_text: a,
          })),
        },
        comparison_submissions: otherSubs.map((s) => ({
          student_name: s.studentInfo?.name ?? 'Unknown',
          answers: s.answers.map((a, i) => ({
            question_number: i + 1,
            answer_text: a,
          })),
        })),
      });

      const result = await callAIAgent(message, PLAGIARISM_AGENT_ID);

      if (result.success) {
        const data = parseAgentResponse(result) as PlagiarismResponse | null;
        if (data) {
          onResult(submission.id, data);
        } else {
          setError('Failed to parse plagiarism results.');
        }
      } else {
        setError(result?.error ?? 'Plagiarism check failed.');
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
          <FiShield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No submission selected</p>
          <p className="text-sm mt-1">Grade a submission first to check for plagiarism.</p>
        </CardContent>
      </Card>
    );
  }

  const pr = submission.plagiarismResult;

  return (
    <div className="space-y-6">
      {/* Action Button */}
      {!pr && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <FiShield className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
            <h3 className="font-semibold text-slate-700 mb-1">Plagiarism Detection</h3>
            <p className="text-sm text-slate-500 mb-4">
              Check this submission against {allSubmissions.filter((s) => s.assignmentId === submission.assignmentId && s.id !== submission.id).length} other submissions
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mb-3 flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </p>
            )}
            <Button onClick={handleCheck} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><FiSearch className="w-4 h-4" /> Check Plagiarism</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {pr && (
        <>
          {/* Summary */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FiShield className="w-5 h-5 text-indigo-600" />
                Plagiarism Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-3xl font-bold text-slate-800">{Math.round(pr.overall_plagiarism_score ?? 0)}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Similarity Score</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Badge className={`text-sm px-3 py-1 ${getRiskColor(pr.risk_level ?? '')}`}>
                    {pr.risk_level ?? 'Unknown'}
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1.5">Risk Level</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium text-slate-700">
                    {Array.isArray(pr.question_analysis) ? pr.question_analysis.filter((q) => q.flagged).length : 0}
                    /{Array.isArray(pr.question_analysis) ? pr.question_analysis.length : 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Flagged Questions</div>
                </div>
              </div>

              {/* Similarity bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Similarity</span>
                  <span>{Math.round(pr.overall_plagiarism_score ?? 0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${(pr.overall_plagiarism_score ?? 0) > 50 ? 'bg-red-500' : (pr.overall_plagiarism_score ?? 0) > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pr.overall_plagiarism_score ?? 0, 100)}%` }}
                  />
                </div>
              </div>

              {pr.summary && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Summary</h4>
                  <p className="text-sm text-slate-600">{pr.summary}</p>
                </div>
              )}

              {pr.recommendation && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-700 mb-1">Recommendation</h4>
                  <p className="text-sm text-blue-600">{pr.recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-question Analysis */}
          {Array.isArray(pr.question_analysis) && pr.question_analysis.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-3">Question-by-Question Analysis</h3>
              <div className="space-y-3">
                {pr.question_analysis.map((qa) => (
                  <Card key={qa.question_number} className={`border ${qa.flagged ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-indigo-600">Question {qa.question_number}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{Math.round(qa.similarity_score ?? 0)}% similar</span>
                          {qa.flagged ? (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              <FiAlertTriangle className="w-3 h-3 mr-1" /> Flagged
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <FiCheck className="w-3 h-3 mr-1" /> Clear
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${qa.flagged ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(qa.similarity_score ?? 0, 100)}%` }}
                        />
                      </div>

                      {Array.isArray(qa.matched_submissions) && qa.matched_submissions.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {qa.matched_submissions.map((ms, i) => (
                            <div key={i} className="text-xs bg-white rounded p-2 border border-slate-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-slate-700">{ms.student_name ?? 'Unknown'}</span>
                                <Badge variant="outline" className="text-xs">{Math.round(ms.similarity_percentage ?? 0)}% match</Badge>
                              </div>
                              {Array.isArray(ms.matched_segments) && ms.matched_segments.length > 0 && (
                                <div className="space-y-1">
                                  {ms.matched_segments.map((seg, j) => (
                                    <p key={j} className="text-slate-500 italic bg-red-50 px-2 py-1 rounded text-xs">{seg}</p>
                                  ))}
                                </div>
                              )}
                              <span className="text-slate-400 text-xs">Confidence: {ms.confidence ?? 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Re-check button */}
          <div className="text-center">
            <Button variant="outline" onClick={handleCheck} disabled={loading} className="gap-2">
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
              Re-check Plagiarism
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
