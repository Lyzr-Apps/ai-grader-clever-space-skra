'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FiAward, FiTarget, FiTrendingUp, FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { Submission, QuestionGradingResult } from './types';
import { getGradeBgColor, getPercentageColor } from './constants';

interface GradingResultsProps {
  submission: Submission | null;
}

function QuestionResultCard({ qr }: { qr: QuestionGradingResult }) {
  const [expanded, setExpanded] = useState(false);
  const pctColor = getPercentageColor(qr.percentage ?? 0);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-indigo-600">Q{qr.question_number}</span>
              <Badge variant="outline" className="text-xs">{qr.marks_awarded}/{qr.max_marks}</Badge>
              <Badge className={`text-xs ${getPercentageColor(qr.percentage ?? 0) === 'bg-emerald-500' ? 'bg-emerald-100 text-emerald-700' : getPercentageColor(qr.percentage ?? 0) === 'bg-blue-500' ? 'bg-blue-100 text-blue-700' : getPercentageColor(qr.percentage ?? 0) === 'bg-amber-500' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{Math.round(qr.percentage ?? 0)}%</Badge>
            </div>
            <p className="text-sm text-slate-600">{qr.question_text ?? ''}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
          <div className={`h-2 rounded-full transition-all duration-500 ${pctColor}`} style={{ width: `${Math.min(qr.percentage ?? 0, 100)}%` }} />
        </div>

        {/* Justification */}
        <p className="text-sm text-slate-700 mb-2">{qr.justification ?? ''}</p>

        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-600 hover:text-indigo-700 p-0 h-auto">
          {expanded ? <><FiChevronUp className="w-3.5 h-3.5 mr-1" /> Show Less</> : <><FiChevronDown className="w-3.5 h-3.5 mr-1" /> Show Details</>}
        </Button>

        {expanded && (
          <div className="mt-3 space-y-3 text-sm">
            {/* Keyword Coverage */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h5 className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <FiTarget className="w-3.5 h-3.5" /> Keyword Coverage ({Math.round(qr.keyword_coverage?.coverage_percentage ?? 0)}%)
              </h5>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(qr.keyword_coverage?.coverage_percentage ?? 0, 100)}%` }} />
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {Array.isArray(qr.keyword_coverage?.matched_keywords) && qr.keyword_coverage.matched_keywords.map((kw, i) => (
                  <Badge key={i} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">{kw}</Badge>
                ))}
              </div>
              {Array.isArray(qr.keyword_coverage?.missing_keywords) && qr.keyword_coverage.missing_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-slate-500 mr-1">Missing:</span>
                  {qr.keyword_coverage.missing_keywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-red-500 border-red-200">{kw}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Indicators */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Accuracy</div>
                <div className="text-xs font-semibold text-slate-700">{qr.concept_accuracy ?? 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Completeness</div>
                <div className="text-xs font-semibold text-slate-700">{qr.completeness ?? 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Structure</div>
                <div className="text-xs font-semibold text-slate-700">{qr.structure_quality ?? 'N/A'}</div>
              </div>
            </div>

            {/* Strengths */}
            {Array.isArray(qr.strengths) && qr.strengths.length > 0 && (
              <div>
                <h5 className="font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5" /> Strengths
                </h5>
                <ul className="space-y-0.5">
                  {qr.strengths.map((s, i) => (
                    <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">--</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Points */}
            {Array.isArray(qr.missing_points) && qr.missing_points.length > 0 && (
              <div>
                <h5 className="font-semibold text-amber-700 mb-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5" /> Missing Points
                </h5>
                <ul className="space-y-0.5">
                  {qr.missing_points.map((m, i) => (
                    <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">--</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Suggestions */}
            {Array.isArray(qr.improvement_suggestions) && qr.improvement_suggestions.length > 0 && (
              <div>
                <h5 className="font-semibold text-blue-700 mb-1 flex items-center gap-1">
                  <FiTrendingUp className="w-3.5 h-3.5" /> Suggestions
                </h5>
                <ul className="space-y-0.5">
                  {qr.improvement_suggestions.map((s, i) => (
                    <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">--</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GradingResults({ submission }: GradingResultsProps) {
  const gr = submission?.gradingResult;

  if (!submission || !gr) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          <FiAward className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No grading results available</p>
          <p className="text-sm mt-1">Submit an answer sheet first to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  const gradingResults = Array.isArray(gr.grading_results) ? gr.grading_results : [];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAward className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-lg text-slate-800">Grading Summary</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-slate-800">
                {gr.total_marks_awarded ?? 0}/{gr.total_max_marks ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Total Marks</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">{Math.round(gr.overall_percentage ?? 0)}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Percentage</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className={`text-2xl font-bold ${getGradeBgColor(gr.overall_grade ?? '')} inline-block px-3 py-0.5 rounded-md`}>
                {gr.overall_grade ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Grade</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm font-semibold text-slate-700">{gr.performance_category ?? 'N/A'}</div>
              <div className="text-xs text-slate-500 mt-0.5">Category</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm font-semibold text-slate-700">{gradingResults.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Questions</div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
            <div className={`h-3 rounded-full transition-all duration-700 ${getPercentageColor(gr.overall_percentage ?? 0)}`} style={{ width: `${Math.min(gr.overall_percentage ?? 0, 100)}%` }} />
          </div>

          {gr.overall_feedback && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Overall Feedback</h4>
              <p className="text-sm text-slate-600">{gr.overall_feedback}</p>
            </div>
          )}

          {/* Student Info */}
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
            <span>Student: <strong className="text-slate-700">{submission.studentInfo?.name ?? 'Unknown'}</strong></span>
            <Separator orientation="vertical" className="h-4" />
            <span>ID: {submission.studentInfo?.studentId ?? 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-question results */}
      <div>
        <h3 className="font-semibold text-sm text-slate-700 mb-3">Question-by-Question Breakdown</h3>
        <ScrollArea className="h-auto max-h-[600px]">
          <div className="space-y-3">
            {gradingResults.map((qr) => (
              <QuestionResultCard key={qr.question_number} qr={qr} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
