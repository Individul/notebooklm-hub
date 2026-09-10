export type SourceType = 'pdf' | 'doc' | 'web' | 'youtube' | 'drive' | 'text';

export interface SourceItem {
  id: string;
  title: string;
  type: SourceType;
  url?: string;
  content?: string;
}

export type AudioStatus = 'generated' | 'pending' | 'none';

export interface Notebook {
  id: string;
  notebookLmId?: string;
  title: string;
  description: string;
  category: string;
  url: string;
  sources: SourceItem[];
  tags: string[];
  audioOverviewStatus: AudioStatus;
  keyQuestions: string[];
  notes: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES = [
  'Toate',
  'Juridic & Legislație RM',
  'Cercetare & Știință',
  'Dezvoltare & Programare',
  'Muncă & Proiecte',
  'Studiu & Cursuri',
  'Finanțe & Business',
  'Personale & Idei',
] as const;

export type Category = typeof DEFAULT_CATEGORIES[number];
