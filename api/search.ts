import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

// Helper to infer CIP (Clasificación Internacional de Patentes) code & title from text or existing IPC data
function getCipInfo(item: any, textForCip: string): { cipCode: string; cipDescription: string } {
  // Check if item has official IPC codes from Europe PMC
  const rawIpc = item.patentInternationalClassificationList?.patentInternationalClassification ||
                 item.patentDetails?.patentInternationalClassificationList?.patentInternationalClassification ||
                 item.ipcList?.ipc;

  if (Array.isArray(rawIpc) && rawIpc.length > 0) {
    const code = rawIpc[0].trim();
    // Provide clean description or default mapping
    return {
      cipCode: code,
      cipDescription: mapCipToDescription(code, textForCip)
    };
  } else if (typeof rawIpc === 'string' && rawIpc.trim()) {
    return {
      cipCode: rawIpc.trim(),
      cipDescription: mapCipToDescription(rawIpc.trim(), textForCip)
    };
  }

  // Fallback / AI dictionary mapping based on text content
  const lower = textForCip.toLowerCase();
  if (/beehive|apiary|colmena|abeja|honey|apicultura/i.test(lower)) {
    return { cipCode: 'A01K 47/00', cipDescription: 'Apicultura: Colmenas y dispositivos automáticos de monitoreo y control' };
  }
  if (/acoustic|audio|frequency|fft|sound|sonido|frecuencia|piezo/i.test(lower)) {
    return { cipCode: 'G10L 25/00', cipDescription: 'Análisis de señales de voz o sonido y reconocimiento de patrones acústicos' };
  }
  if (/remote monitoring|alarm|telemetry|iot|wireless|sensor|monitoreo|remoto/i.test(lower)) {
    return { cipCode: 'G08B 21/00', cipDescription: 'Alarmas y sistemas automatizados de monitoreo remoto por sensores' };
  }
  if (/temperature|heating|thermal|temperatura|calefaccion|climatizacion/i.test(lower)) {
    return { cipCode: 'G05D 23/00', cipDescription: 'Control automático de temperatura y regulación climatológica' };
  }
  if (/crop|plant|soil|irrigation|agricul|cultivo|riego|horticult/i.test(lower)) {
    return { cipCode: 'A01G 25/00', cipDescription: 'Horticultura, silvicultura y sistemas automatizados de riego agrícola' };
  }
  if (/food|microencapsul|preservation|alimento|encapsul/i.test(lower)) {
    return { cipCode: 'A23L 3/00', cipDescription: 'Conservación y procesamiento tecnológico de alimentos y productos comestibles' };
  }
  if (/drug|pharma|medicine|nanoparticle|farmac|medicament/i.test(lower)) {
    return { cipCode: 'A61K 9/00', cipDescription: 'Preparaciones medicinales y sistemas de administración de fármacos' };
  }
  if (/medical|diagnos|surgery|medico|quirurg/i.test(lower)) {
    return { cipCode: 'A61B 5/00', cipDescription: 'Dispositivos médicos para diagnóstico o medición fisiológica' };
  }
  if (/water|wastewater|filtration|purification|agua|filtracion/i.test(lower)) {
    return { cipCode: 'C02F 1/00', cipDescription: 'Tratamiento de agua, aguas residuales y sistemas purificadores' };
  }
  if (/solar|photovoltaic|battery|energy|bateria|energia/i.test(lower)) {
    return { cipCode: 'H02S 10/00', cipDescription: 'Generación de energía solar fotovoltaica o sistemas de almacenamiento eléctrico' };
  }
  if (/software|neural network|ai|machine learning|inteligencia artificial/i.test(lower)) {
    return { cipCode: 'G06N 3/00', cipDescription: 'Sistemas computacionales basados en inteligencia artificial y redes neuronales' };
  }
  if (/robot|manipulator|automation|robotica|automatiz/i.test(lower)) {
    return { cipCode: 'B25J 9/00', cipDescription: 'Manipuladores robóticos y sistemas automatizados de control mecánico' };
  }
  if (/polymer|catalys|chemical synthesis|polimer|sintesis/i.test(lower)) {
    return { cipCode: 'C08F 2/00', cipDescription: 'Procesos de polimerización y síntesis de compuestos macromoleculares' };
  }

  return { cipCode: 'G06Q 10/00', cipDescription: 'Tecnologías de la información, sistemas o procesos generales de innovación técnica' };
}

function mapCipToDescription(code: string, text: string): string {
  const clean = code.toUpperCase().trim();
  if (clean.startsWith('A01K')) return 'Apicultura: Colmenas y dispositivos para control y cuidado de abejas';
  if (clean.startsWith('A01G')) return 'Horticultura, silvicultura y sistemas agrícolas de riego';
  if (clean.startsWith('A23L')) return 'Conservación y procesamiento tecnológico de alimentos';
  if (clean.startsWith('A61K')) return 'Preparaciones medicinales, fármacos y composiciones farmacéuticas';
  if (clean.startsWith('A61B')) return 'Dispositivos y sistemas médicos de diagnóstico e intervención';
  if (clean.startsWith('G08B')) return 'Sistemas de alarma y dispositivos de monitoreo remoto';
  if (clean.startsWith('G05D')) return 'Sistemas de regulación y control automático de parámetros (temperatura, flujo)';
  if (clean.startsWith('G10L')) return 'Análisis y procesamiento de señales sonoras o acústicas';
  if (clean.startsWith('G06N')) return 'Modelos computacionales, inteligencia artificial y redes neuronales';
  if (clean.startsWith('H02S') || clean.startsWith('H01M')) return 'Sistemas fotovoltaicos, baterías y tecnologías de energía limpia';
  if (clean.startsWith('C02F')) return 'Tratamiento y purificación técnica de agua y fluidos residuales';
  if (clean.startsWith('B25J')) return 'Manipuladores robóticos y mecánica automatizada';
  return 'Clasificación Internacional de Patentes (CIP / IPC)';
}

function determineDocType(item: any): { type: 'patent' | 'article' | 'thesis' | 'other'; label: string } {
  const src = (item.source || '').toUpperCase();
  const title = (item.title || '').toLowerCase();
  const pubTypes: string[] = item.pubTypeList?.pubType || [];

  if (src === 'PAT' || pubTypes.some(p => /patent/i.test(p))) {
    return { type: 'patent', label: '🔬 Patente de Invención / Modelo' };
  }
  if (src === 'ETH' || /thesis|dissertation|tesis/i.test(title) || pubTypes.some(p => /thesis|dissertation/i.test(p))) {
    return { type: 'thesis', label: '🎓 Tesis / Trabajo de Grado' };
  }
  if (src === 'MED' || src === 'PMC' || src === 'PPR' || pubTypes.some(p => /article|journal|review/i.test(p))) {
    return { type: 'article', label: '📄 Artículo de Investigación Científica' };
  }
  return { type: 'other', label: '📑 Documento Técnico de Referencia' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const TARGET_COUNT = 12; // Ensure steady, rich results every time without jumping between 2 and 15
    const resultMap = new Map<string, any>();

    const runQuery = async (q: string, restrictToPatents: boolean = true) => {
      const filter = restrictToPatents ? '(SRC:PAT) AND ' : '';
      const fullQuery = `${filter}(${q})`;
      const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(fullQuery)}&format=json&resultType=core&pageSize=15`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return data.resultList?.result || [];
    };

    // Attempt 1: Exact query restricted to patents
    const pass1 = await runQuery(query, true);
    pass1.forEach((item: any) => { if (item.id) resultMap.set(item.id, item); });

    // Attempt 2: If we have fewer than TARGET_COUNT, run exact query across all technical literature (patents, articles, theses)
    if (resultMap.size < TARGET_COUNT) {
      const pass2 = await runQuery(query, false);
      pass2.forEach((item: any) => { if (item.id && !resultMap.has(item.id)) resultMap.set(item.id, item); });
    }

    // Attempt 3: If still under TARGET_COUNT, extract core technical keywords and run a relaxed AND query
    if (resultMap.size < TARGET_COUNT) {
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
        const relaxedAndQuery = words.slice(0, 3).join(' AND ');
        const pass3 = await runQuery(relaxedAndQuery, true);
        pass3.forEach((item: any) => { if (item.id && !resultMap.has(item.id)) resultMap.set(item.id, item); });

        // If still under TARGET_COUNT, run relaxed OR query across patents
        if (resultMap.size < TARGET_COUNT) {
          const relaxedOrQuery = words.slice(0, 4).join(' OR ');
          const pass4 = await runQuery(relaxedOrQuery, true);
          pass4.forEach((item: any) => { if (item.id && !resultMap.has(item.id)) resultMap.set(item.id, item); });
        }
      }
    }

    // Format all unique items up to TARGET_COUNT
    const uniqueItems = Array.from(resultMap.values()).slice(0, TARGET_COUNT);

    const results = uniqueItems.map((item: any) => {
      const docTypeInfo = determineDocType(item);
      const fullTextForCip = `${item.title || ''} ${item.abstractText || ''}`;
      const cipInfo = getCipInfo(item, fullTextForCip);
      const pubYear = item.pubYear || (item.firstPublicationDate ? item.firstPublicationDate.slice(0, 4) : 'N/A');

      return {
        id: item.id,
        title: item.title || 'Untitled Technical Document',
        abstract: item.abstractText || 'No abstract available for this technical document.',
        source: item.source || 'PAT',
        inventor: item.authorString || 'Unknown Inventor/Author',
        assignee: item.patentAssignee || item.journalInfo?.journal?.title || 'Independent / Research Org',
        link: `https://europepmc.org/article/${item.source || 'PAT'}/${item.id}`,
        documentType: docTypeInfo.type,
        documentTypeLabel: docTypeInfo.label,
        cipCode: cipInfo.cipCode,
        cipDescription: cipInfo.cipDescription,
        year: pubYear
      };
    });

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error during search' });
  }
}
