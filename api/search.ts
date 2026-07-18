import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    let rawResults: any[] = [];

    // Helper to query Europe PMC
    const runQuery = async (q: string) => {
      const fullQuery = `(SRC:PAT) AND (${q})`;
      const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(fullQuery)}&format=json&resultType=core&pageSize=15`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return data.resultList?.result || [];
    };

    // Attempt 1: Exact query provided by AI / user
    rawResults = await runQuery(query);

    // Attempt 2: If 0 results, clean terms (extract technical words >= 4 chars, remove stopwords & boolean operators)
    if (!rawResults || rawResults.length === 0) {
      const stopwords = [
        'method', 'process', 'using', 'like', 'with', 'from', 'food', 'device', 'system',
        'metodo', 'para', 'como', 'utilizando', 'alimentos', 'sistema', 'proceso', 'dispositivo',
        'and', 'or', 'not', 'that', 'which', 'este', 'esta', 'donde'
      ];
      const words = query
        .replace(/[()"]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 4 && !stopwords.includes(w.toLowerCase()));

      if (words.length > 0) {
        // Try top 3 technical words with AND
        const relaxedAndQuery = words.slice(0, 3).join(' AND ');
        rawResults = await runQuery(relaxedAndQuery);

        // Attempt 3: If still 0 results, try top 4 technical words with OR to guarantee relevant hits
        if (!rawResults || rawResults.length === 0) {
          const relaxedOrQuery = words.slice(0, 4).join(' OR ');
          rawResults = await runQuery(relaxedOrQuery);
        }
      }
    }

    const results = rawResults.map((item: any) => ({
      id: item.id,
      title: item.title,
      abstract: item.abstractText || 'No abstract available.',
      source: item.source,
      inventor: item.authorString || 'Unknown',
      assignee: item.patentAssignee || 'Unknown',
      link: `https://europepmc.org/article/PAT/${item.id}`
    }));

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error during search' });
  }
}
