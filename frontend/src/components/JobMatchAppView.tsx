import React, { useState, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
  RefreshCw,
  FileText,
  Upload,
  FileCheck,
  X,
  FileCode2
} from 'lucide-react';
import { JobMatchResponse, CandidateProfile } from '../types';
import { ApiService } from '../services/api';
import { sahilProfile } from '../data/candidateData';

interface JobMatchAppViewProps {
  profile?: CandidateProfile;
}

export const JobMatchAppView: React.FC<JobMatchAppViewProps> = ({ profile }) => {
  const p = profile || sahilProfile;
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<JobMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a Job Description text to evaluate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const matchData = await ApiService.evaluateJobMatch({
        jobDescription: jobDescription.trim(),
      });
      setResult(matchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate job description.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setJobDescription('');
    setError(null);
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto h-full overflow-y-auto space-y-4 sm:space-y-6 window-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 mb-1">
            AI Diagnostic Engine
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Job Description Matcher & AI Gap Analyzer
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Paste job description requirements below to match against {p.name}'s verified resume & AI profile.
          </p>
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleEvaluate} className="space-y-5 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="space-y-2">
            <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Paste Job Description / Qualifications Needed
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste Job Description here... (e.g. Seeking a Full-Stack AI Engineer with Python, FastAPI, React, TypeScript, RAG, and PostgreSQL experience...)"
              className="w-full bg-slate-100 dark:bg-slate-950 p-3 font-sans text-xs border border-slate-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !jobDescription.trim()}
              className="win-btn win-btn-primary py-2.5 px-6 font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  Evaluating Candidate Match with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  Run AI Match Analysis
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 window-enter">
          {/* Match Score Banner */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-blue-500/30 rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 dark:from-blue-950/40 via-white dark:via-slate-900 to-emerald-50/50 dark:to-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-xs uppercase tracking-wider font-extrabold text-cyan-600 dark:text-cyan-400">
                AI Compatibility Report
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {result.candidateName} vs. Position Requirements
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                {result.summary}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-600 to-emerald-500 text-white flex flex-col items-center justify-center shadow-xl ring-4 ring-cyan-500/30 font-extrabold">
                <span className="text-3xl">{result.matchScore}%</span>
                <span className="text-[10px] uppercase tracking-wide opacity-90">Match Score</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 font-semibold text-xs">
            <Award className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>AI Hiring Recommendation: {result.recommendation}</span>
          </div>

          {/* Strengths Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Key Candidate Strengths & Alignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.strengths.map((s, idx) => (
                <div key={idx} className="win-card p-3 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold text-sm">•</span>
                  <span className="leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Matching Skills */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Verified Candidate Technical Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.keyMatchingSkills.map((sk, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium text-xs">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {result.missingSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Additional Skills Highlighted in Job Description
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((ms, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
                    {ms}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleReset}
              className="win-btn py-2 px-4 flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Evaluate Another Job Description
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
