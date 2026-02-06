export interface SunoBlueprintResponse {
  suno_title: string;
  suno_style: string;
  suno_lyrics: string;
  analysis: string;
}

export interface UserInput {
  genre: string;
  mood: string;
  vocals: string;
  language: string;
  tempo: string;
  instruments: string[]; // New field for Specific Instruments
  additionalDetails: string;
  productionTexture: string;
  structure: string; 
  audioData?: string;
  audioMimeType?: string;
  // New Advanced Toggles
  isEarworm: boolean;
  isHumanize: boolean;
  isMelodyGuide: boolean;
}

export interface Preset {
  id: string;
  name: string;
  data: Omit<UserInput, 'audioData' | 'audioMimeType'>;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}