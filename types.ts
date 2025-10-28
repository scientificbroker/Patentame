export interface PatentData {
  title: string;
  technicalSector: string;
  priorArt: string;
  inventionSummary: string;
  detailedDescription: string;
  claims: string;
  abstract: string;
  // These are no longer separate fields in the main data structure
  // embodiments: string;
  // drawingsDescription: string;
}

export type PatentSectionKey = keyof PatentData;

export type Language = 'en' | 'es';
export type PatentType = 'invention' | 'utilityModel';

export interface SectionDetail {
  id: PatentSectionKey;
  title: string;
  helpText: string;
  placeholder: string;
  wipoRecommendation: string;
}

export interface UploadedFile {
    name: string;
    content: string;
    mimeType: string;
}