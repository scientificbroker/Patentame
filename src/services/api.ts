export interface PatentResult {
  id: string;
  title: string;
  abstract: string;
  source: string;
  inventor: string;
  assignee: string;
  link: string;
}

export const searchPatents = async (query: string): Promise<PatentResult[]> => {
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
  return data.results || [];
};
