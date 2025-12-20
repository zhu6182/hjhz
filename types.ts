
export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  category: string;
  finish: 'matte' | 'glossy' | 'wood';
  imageUrl?: string;
}

export interface FurnitureAnalysis {
  type: string;
  material: string;
  description: string;
}

export type AppStep = 'HOME' | 'UPLOAD' | 'ANALYZING' | 'CUSTOMIZE' | 'GENERATING' | 'RESULT' | 'MANAGE' | 'LOGIN';

export interface ProjectRecord {
  id: string;
  date: string;
  original: string;
  result: string;
  furnitureType: string;
  colorName: string;
}

export interface AppState {
  originalImage: string | null;
  editedImage: string | null;
  analysis: FurnitureAnalysis | null;
  selectedColor: ColorSwatch | null;
  step: AppStep;
  error: string | null;
  history: ProjectRecord[];
  palettes: ColorSwatch[];
  isAuthenticated?: boolean;
}
