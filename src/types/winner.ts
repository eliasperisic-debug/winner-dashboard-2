export interface Winner {
  month: string;
  brand: 'KIKOFF' | 'GRANT';
  ticket: string;
  theme: string;
  variant: string;
  duration: string;
  execution: string;
  testDifferentiators: string;
  music: string;
  caps: string;
  textOverlay: string;
  mention: string;
  productOverlay: string;
  ifBroll: string;
  notes: string;
  videoUrl: string;
}

export type FilterOptions = {
  brand: string[];
  month: string[];
  execution: string[];
  duration: { min: number; max: number } | null;
};
