export interface PatentResult {
  id: string;
  title: string;
  abstract: string;
  source: string;
  inventor: string;
  assignee: string;
  link: string;
  documentType?: 'patent' | 'article' | 'thesis' | 'other';
  documentTypeLabel?: string;
  cipCode?: string;
  cipDescription?: string;
  year?: string;
}

export interface SearchResponse {
  results: PatentResult[];
  searchEquation?: string;
  detectedCip?: {
    code: string;
    description: string;
  };
  counts?: {
    total: number;
    patents: number;
    theses: number;
    articles: number;
  };
}

export const searchPatentsDetailed = async (query: string): Promise<SearchResponse> => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Search API failed with status: ${response.status}`);
  }

  const data = await response.json();
  return {
    results: data.results || [],
    searchEquation: data.searchEquation,
    detectedCip: data.detectedCip,
    counts: data.counts
  };
};

export const searchPatents = async (query: string): Promise<PatentResult[]> => {
  const res = await searchPatentsDetailed(query);
  return res.results;
};
