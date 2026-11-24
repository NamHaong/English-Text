export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface WordItem {
  id: string;
  word: string;
  pos: string;
  ipa: string;
  meaning: string;
  level: CEFRLevel;
  example: string;
  exampleVi: string;
  sense?: string;
  memorizedAt?: number;
}

export interface UserProgress {
  currentIndex: number;
  memorizedIds: string[];
  streakDays: number;
  lastStudyDate: string;
  totalTested: number;
  correctTested: number;
}
