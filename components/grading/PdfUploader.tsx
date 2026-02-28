'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FiUpload,
  FiFile,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertTriangle,
  FiFileText,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

// ----- Types -----
interface ExtractedAnswer {
  questionNumber: number;
  text: string;
}

interface PdfUploaderProps {
  questionCount: number;
  questionTexts: string[];
  onExtracted: (answers: string[]) => void;
  disabled?: boolean;
}

// ----- PDF.js CDN Loader -----
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';
let pdfjsLib: any = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).pdfjsLib) {
      pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      return resolve(pdfjsLib);
    }

    const script = document.createElement('script');
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib not found on window'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

// ----- Text extraction from PDF -----
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => item.str)
      .filter((s: string) => s.trim().length > 0);
    pages.push(strings.join(' '));
  }

  return pages.join('\n\n');
}

// ----- Smart answer splitting -----
function splitAnswersByQuestions(
  fullText: string,
  questionCount: number,
  questionTexts: string[]
): string[] {
  const answers: string[] = new Array(questionCount).fill('');

  // Strategy 1: Try to match "Q1", "Q2", "Question 1", "Answer 1", "1.", "1)" patterns
  const patterns = [
    // "Question 1:" or "Q1:" or "Q.1:" or "Ques 1:"
    /(?:question|q|ques|qu)[\s.]*(\d+)\s*[:.)\-]/gi,
    // "Answer 1:" or "Ans 1:" or "A1:"
    /(?:answer|ans|a)[\s.]*(\d+)\s*[:.)\-]/gi,
    // "1." or "1)" or "1:" at start of line
    /(?:^|\n)\s*(\d+)\s*[.):\-]\s/g,
  ];

  for (const pattern of patterns) {
    const matches: { index: number; questionNum: number }[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(fullText)) !== null) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= questionCount) {
        matches.push({ index: match.index + match[0].length, questionNum: num });
      }
    }

    if (matches.length >= Math.max(1, Math.floor(questionCount * 0.5))) {
      // Sort by position in text
      matches.sort((a, b) => a.index - b.index);

      // Remove duplicates (keep first occurrence)
      const seen = new Set<number>();
      const uniqueMatches = matches.filter((m) => {
        if (seen.has(m.questionNum)) return false;
        seen.add(m.questionNum);
        return true;
      });

      for (let i = 0; i < uniqueMatches.length; i++) {
        const start = uniqueMatches[i].index;
        const end = i + 1 < uniqueMatches.length ? uniqueMatches[i + 1].index - (uniqueMatches[i + 1].index - start > 20 ? 20 : 0) : fullText.length;

        // Recalculate end more precisely - find start of next question marker
        let actualEnd = fullText.length;
        if (i + 1 < uniqueMatches.length) {
          // Find the beginning of the next question marker (go back to find the pattern start)
          const nextIdx = uniqueMatches[i + 1].index;
          const searchBack = fullText.substring(Math.max(0, nextIdx - 30), nextIdx);
          const markerMatch = searchBack.match(/(?:question|q|ques|qu|answer|ans|a)[\s.]*\d+\s*[:.)\-]/i) || searchBack.match(/\d+\s*[.):\-]\s/);
          if (markerMatch && markerMatch.index !== undefined) {
            actualEnd = Math.max(0, nextIdx - 30) + markerMatch.index;
          } else {
            actualEnd = nextIdx;
          }
        }

        const qIdx = uniqueMatches[i].questionNum - 1;
        if (qIdx >= 0 && qIdx < questionCount) {
          answers[qIdx] = fullText.substring(start, actualEnd).trim();
        }
      }

      // Check if we got meaningful answers
      const filled = answers.filter((a) => a.trim().length > 10).length;
      if (filled >= Math.max(1, Math.floor(questionCount * 0.5))) {
        return answers;
      }
    }
  }

  // Strategy 2: Try paragraph-based splitting
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  if (paragraphs.length >= questionCount) {
    for (let i = 0; i < questionCount; i++) {
      answers[i] = paragraphs[i] ?? '';
    }
    return answers;
  }

  // Strategy 3: Even split of text
  if (fullText.trim().length > 0) {
    const chunkSize = Math.ceil(fullText.length / questionCount);
    for (let i = 0; i < questionCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fullText.length);
      answers[i] = fullText.substring(start, end).trim();
    }
    return answers;
  }

  // Fallback: all text goes into first answer
  answers[0] = fullText.trim();
  return answers;
}

// ----- Component -----
export default function PdfUploader({
  questionCount,
  questionTexts,
  onExtracted,
  disabled = false,
}: PdfUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [extractedAnswers, setExtractedAnswers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;

      if (selected.type !== 'application/pdf') {
        setError('Please upload a PDF file only.');
        return;
      }

      if (selected.size > 20 * 1024 * 1024) {
        setError('File size must be under 20MB.');
        return;
      }

      setFile(selected);
      setError('');
      setApplied(false);
      setExtracting(true);
      setExtractedText('');
      setExtractedAnswers([]);

      try {
        const pdfjs = await loadPdfJs();

        // Get page count
        const arrayBuffer = await selected.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);

        // Extract text
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items
            .map((item: any) => item.str)
            .filter((s: string) => s.trim().length > 0);
          pages.push(strings.join(' '));
        }

        const fullText = pages.join('\n\n');

        if (!fullText.trim()) {
          setError(
            'No text could be extracted from this PDF. The file may contain only scanned images. Please type your answers manually instead.'
          );
          setExtracting(false);
          return;
        }

        setExtractedText(fullText);

        // Split into answers
        const split = splitAnswersByQuestions(fullText, questionCount, questionTexts);
        setExtractedAnswers(split);
      } catch (err: any) {
        console.error('PDF extraction error:', err);
        setError(
          err?.message?.includes('CDN')
            ? 'Failed to load PDF parser. Please check your internet connection and try again.'
            : 'Failed to extract text from the PDF. The file may be corrupted or password-protected.'
        );
      } finally {
        setExtracting(false);
      }
    },
    [questionCount, questionTexts]
  );

  const handleApply = useCallback(() => {
    onExtracted(extractedAnswers);
    setApplied(true);
  }, [extractedAnswers, onExtracted]);

  const handleClear = useCallback(() => {
    setFile(null);
    setExtractedText('');
    setExtractedAnswers([]);
    setError('');
    setApplied(false);
    setPageCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFile = e.dataTransfer?.files?.[0];
      if (droppedFile && droppedFile.type === 'application/pdf') {
        // Simulate file input
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        if (fileInputRef.current) {
          fileInputRef.current.files = dt.files;
          fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        setError('Please drop a PDF file only.');
      }
    },
    []
  );

  return (
    <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUpload className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Upload PDF Answer Sheet</span>
            <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
              Optional
            </Badge>
          </div>
          {file && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-slate-500 hover:text-red-500 gap-1 h-7 px-2"
            >
              <FiX className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>

        {/* Drop Zone / File Input */}
        {!file && !extracting && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-indigo-200 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiFileText className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Drop your PDF answer sheet here or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF files up to 20MB. Text will be extracted and mapped to questions automatically.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              disabled={disabled}
              className="hidden"
            />
          </div>
        )}

        {/* Extracting State */}
        {extracting && (
          <div className="flex items-center gap-3 py-4 justify-center">
            <FiLoader className="w-5 h-5 text-indigo-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-indigo-700">Extracting text from PDF...</p>
              <p className="text-xs text-slate-500">This may take a moment for larger files</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md flex items-center gap-1.5">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}

        {/* File Info & Extracted Preview */}
        {file && !extracting && extractedText && (
          <div className="space-y-3">
            {/* File Info Bar */}
            <div className="flex items-center gap-3 bg-white rounded-md px-3 py-2 border border-slate-200">
              <FiFile className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                  {pageCount > 0 && ` -- ${pageCount} page${pageCount > 1 ? 's' : ''}`}
                  {` -- ${extractedText.length.toLocaleString()} characters extracted`}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs flex-shrink-0">
                <FiCheck className="w-3 h-3 mr-1" /> Extracted
              </Badge>
            </div>

            {/* Raw Text Toggle */}
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              {showRawText ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
              {showRawText ? 'Hide' : 'Show'} raw extracted text
            </button>

            {showRawText && (
              <div className="bg-white border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {extractedText.length > 3000 ? extractedText.substring(0, 3000) + '\n\n... (truncated)' : extractedText}
                </pre>
              </div>
            )}

            <Separator className="bg-slate-200" />

            {/* Answer Mapping Preview */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Mapped to {questionCount} question{questionCount > 1 ? 's' : ''}:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {extractedAnswers.map((ans, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-md p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-indigo-600">
                        Question {idx + 1}
                      </span>
                      {ans.trim() ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                          {ans.trim().split(/\s+/).length} words
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                          Empty
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {ans.trim() || '(No text mapped for this question)'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {!applied ? (
                <Button
                  onClick={handleApply}
                  disabled={disabled}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-sm"
                  size="sm"
                >
                  <FiCheck className="w-3.5 h-3.5" /> Apply to Answer Fields
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs py-1 px-2">
                    <FiCheck className="w-3 h-3 mr-1" /> Applied to answer fields
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApply}
                    disabled={disabled}
                    className="text-xs gap-1 h-7"
                  >
                    <FiRefreshCw className="w-3 h-3" /> Re-apply
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500 ml-2">
                You can edit answers after applying.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
