import { JobMatchResponse, CandidateProfile } from '../types';
import { generateResumePDF } from '../utils/pdfGenerator';

export interface ChatMessageRequest {
  question: string;
  stream?: boolean;
  fastApiUrl?: string;
}

export interface JobMatchParams {
  jobDescription?: string;
  pdfBase64?: string;
  fileName?: string;
}

export class ApiService {
  /**
   * Fetch live candidate info (parsed from my_resume.pdf if available)
   */
  static async getCandidateInfo(): Promise<CandidateProfile | null> {
    try {
      const response = await fetch('/api/candidate-info');
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Failed to fetch candidate info from backend:', e);
    }
    return null;
  }

  /**
   * Send question to backend chat endpoint
   * Handles streaming response or standard JSON response
   */
  static async sendChatMessage(
    params: ChatMessageRequest,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const { question, stream = true, fastApiUrl } = params;

    // Use user-provided FastAPI URL or fallback to current origin
    const baseUrl = fastApiUrl ? fastApiUrl.replace(/\/$/, '') : '';
    const endpoint = baseUrl ? `${baseUrl}/chat` : '/chat';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream, text/plain',
        },
        body: JSON.stringify({ question, stream }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // Check if response is stream
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep last incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.substring(5).trim();
              if (jsonStr) {
                try {
                  const data = JSON.parse(jsonStr);
                  if (data.chunk) {
                    fullText += data.chunk;
                    if (onChunk) onChunk(fullText);
                  }
                  if (data.done) {
                    return fullText;
                  }
                } catch {
                  // Raw text fallback
                  fullText += jsonStr;
                  if (onChunk) onChunk(fullText);
                }
              }
            }
          }
        }
        return fullText;
      } else {
        // Standard JSON response matching FastAPI schema: {"answer": "..."}
        const data = await response.json();
        const answer = data.answer || data.message || data.response || 'No answer provided.';
        if (onChunk) onChunk(answer);
        return answer;
      }
    } catch (error) {
      console.warn('API Service chat error, utilizing client resilience fallback:', error);
      throw error;
    }
  }

  /**
   * Run Job Match evaluation on a Job Description (Text or PDF)
   */
  static async evaluateJobMatch(params: string | JobMatchParams): Promise<JobMatchResponse> {
    try {
      const payload = typeof params === 'string' ? { jobDescription: params } : params;
      const response = await fetch('/api/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Job Match request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Job Match Error:', error);
      throw error;
    }
  }

  /**
   * Test user's custom FastAPI connection
   */
  static async testFastApiUrl(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanUrl = url.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          message: data.message || `Connected to FastAPI server at ${cleanUrl}!`,
        };
      } else {
        return {
          success: false,
          message: `FastAPI server returned status ${response.status}`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reach FastAPI endpoint.',
      };
    }
  }

  /**
   * Trigger Official Resume PDF Download
   */
  static async downloadResumePDF(): Promise<void> {
    try {
      const profile = await this.getCandidateInfo();
      generateResumePDF(profile);
    } catch (e) {
      console.error('PDF resume generation error:', e);
      generateResumePDF();
    }
  }

  /**
   * Trigger Resume File Download (Defaults to PDF)
   */
  static async downloadResume(): Promise<void> {
    await this.downloadResumePDF();
  }

  /**
   * Download Resume in Markdown Format
   */
  static async downloadResumeMarkdown(): Promise<void> {
    try {
      const response = await fetch('/api/resume/download');
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sahil_Singh_Resume.md';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Resume download error:', e);
      throw e;
    }
  }
}
