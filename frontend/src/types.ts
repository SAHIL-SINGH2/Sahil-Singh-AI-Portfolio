export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  codeBlocks?: { language: string; code: string }[];
  category?: 'skills' | 'projects' | 'experience' | 'education' | 'general';
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  isPinned?: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  highlights: string[];
  category: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  location?: string;
  description: string;
  skillsUsed: string[];
  type: 'Full-time' | 'Internship' | 'Contract';
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  duration: string;
  cgpa: string;
  scoreLabel: string;
  highlights: string[];
}

export interface CandidateProfile {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  portfolio: string;
  avatarUrl: string;
  totalExperienceYears: number;
  bio: string;
  skills: {
    languages: string[];
    frameworks: string[];
    aiMl: string[];
    databases: string[];
    tools: string[];
  };
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  achievements: string[];
  personalDetails?: string;
  resumeRawText?: string;
}

export interface JobMatchRequest {
  jobDescription: string;
}

export interface JobMatchResponse {
  matchScore: number;
  candidateName: string;
  summary: string;
  strengths: string[];
  missingSkills: string[];
  recommendation: string;
  keyMatchingSkills: string[];
}

export type SidebarTab =
  | 'chat'
  | 'projects'
  | 'skills'
  | 'experience'
  | 'education'
  | 'achievements'
  | 'resume'
  | 'about';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string; // hex or class
  backendUrl: string;
  autoScroll: boolean;
  soundEffects: boolean;
  streamingEnabled: boolean;
}
