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
    // Europe PMC REST API
    // We force the source to be PAT (Patents)
    const fullQuery = `(SRC:PAT) AND (${query})`;
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(fullQuery)}&format=json&resultType=core`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Europe PMC API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract and format relevant patent data
    const results = data.resultList?.result?.map((item: any) => ({
      id: item.id,
      title: item.title,
      abstract: item.abstractText || 'No abstract available.',
      source: item.source,
      inventor: item.authorString || 'Unknown',
      assignee: item.patentAssignee || 'Unknown',
      link: `https://europepmc.org/article/PAT/${item.id}`
    })) || [];

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error during search' });
  }
}
