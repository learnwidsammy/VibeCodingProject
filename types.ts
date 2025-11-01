
export interface Selection {
  text: string;
  start: number;
  end: number;
}

export enum AiAction {
  IMPROVE = 'improve',
  SUMMARIZE_SELECTION = 'summarize_selection',
  CHANGE_TONE = 'change_tone',
  SUMMARIZE_DOCUMENT = 'summarize_document',
  GENERATE_OUTLINE = 'generate_outline',
  SUGGEST_TITLES = 'suggest_titles',
  GENERATE_OUTLINE_FROM_PROMPT = 'generate_outline_from_prompt',
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  FRIENDLY = 'Friendly',
  CONFIDENT = 'Confident',
  HUMOROUS = 'Humorous',
}

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'link'
  | 'image'
  | 'table'
  | 'ul'
  | 'ol'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export type ViewMode = 'split' | 'editor' | 'preview';

export type AiFeature = 'chat' | 'image' | 'video' | 'search' | 'map' | 'audio' | 'tts' | 'brain';
