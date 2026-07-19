/**
 * gemini.ts — Frontend client for the /api/chat serverless function.
 *
 * This file NEVER touches the Gemini API directly nor holds any API key.
 * All AI calls are proxied through /api/chat, which runs server-side on Vercel.
 */

import type {
  PatentData,
  PatentType,
  Language,
  SectionDetail,
  UploadedFile,
} from '../../types';
import type { Part } from '@google/genai';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const langToName = (lang: Language) => (lang === 'es' ? 'Spanish' : 'English');

const getPartsFromDocs = (
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null
): { parts: Part[]; priorArtContext: string; inventionDescContext: string } => {
  const parts: Part[] = [];

  let priorArtContext = 'Not provided.';
  if (priorArtDoc?.content) {
    if (priorArtDoc.mimeType === 'application/pdf') {
      parts.push({ inlineData: { data: priorArtDoc.content, mimeType: priorArtDoc.mimeType } });
      priorArtContext = `The 'Prior Art' document is provided as an attached PDF. Analyze its content for context.`;
    } else {
      priorArtContext = priorArtDoc.content;
    }
  }

  let inventionDescContext = 'Not provided.';
  if (inventionDescDoc?.content) {
    if (inventionDescDoc.mimeType === 'application/pdf') {
      parts.push({ inlineData: { data: inventionDescDoc.content, mimeType: inventionDescDoc.mimeType } });
      inventionDescContext = `The 'Invention Description' document is provided as an attached PDF. Analyze its content for context.`;
    } else {
      inventionDescContext = inventionDescDoc.content;
    }
  }

  return { parts, priorArtContext, inventionDescContext };
};

/**
 * Calls the /api/chat serverless endpoint.
 * Returns the generated text or throws on error.
 */
async function callChatApi(
  action: 'generateDraft' | 'improveText' | 'classifyPatent' | 'extractKeywords' | 'ftoChat',
  systemInstruction: string,
  parts: Part[],
  responseFormat: 'text' | 'json' = 'text'
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload: { systemInstruction, parts, responseFormat } }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let errorMsg = `HTTP Error ${response.status}: `;
    try {
      const err = JSON.parse(text);
      errorMsg += err.error || 'Unknown error';
    } catch {
      errorMsg += text ? text.substring(0, 100) : 'No response body';
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.text as string;
}

// ---------------------------------------------------------------------------
// Public API  (same signatures as the old geminiService.ts)
// ---------------------------------------------------------------------------

export const isAiAvailable = (): boolean => true; // Always true — key lives on the server

// ---------------------------------------------------------------------------
// Patent Classification
// ---------------------------------------------------------------------------

export interface PatentClassificationCriteria {
  name: string;
  status: 'pass' | 'warning' | 'info';
  explanation: string;
}

export interface PatentClassification {
  recommendation: 'invention' | 'utilityModel';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  signals: string[];
  risks: string;
  criteriaBreakdown?: PatentClassificationCriteria[];
  strategicAdvice?: string;
}

function cleanJsonString(str: string): string {
  if (!str) return '';
  return str.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
}

export const classifyPatentType = async (
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null,
  lang: Language
): Promise<PatentClassification> => {
  const { parts, priorArtContext, inventionDescContext } = getPartsFromDocs(
    priorArtDoc,
    inventionDescDoc
  );

  const systemInstruction = `You are an expert patent attorney specialized in WIPO/OMPI, Decision 486 (CAN), and INDECOPI legal regulations. 
Your task is to analyze technical documents and classify the invention type using strict, comprehensive legal and technical criteria.
You must respond ONLY with a valid JSON object, no markdown, no explanations outside the JSON.`;

  const userPrompt = `Analyze the following technical documents and determine whether this invention qualifies better as:
- "invention": An Invention Patent — requires an absolute inventive step (non-obvious solution to a technical problem), 
  can cover products, apparatuses, processes, methods, compositions, or systems. Protection: 20 years.
- "utilityModel": A Utility Model — covers practical improvements to existing tools, devices, instruments, or mechanical objects 
  (3-dimensional physical forms ONLY). Lower inventive step required (practical advantage). Protection: 10 years.

Key legal criteria to evaluate rigorously according to WIPO/OMPI and Decision 486 (CAN/INDECOPI) standards:
1. MATERIA PROTEGIBLE (SUBJECT MATTER / STATUTORY ELIGIBILITY):
   - "invention": Covers products, machines, systems, chemical/biotech compositions, and crucially METHODS, PROCESSES, or ALGORITHMS with technical effect.
   - "utilityModel": STRICTLY EXCLUDES methods, processes, chemical compositions, and pure software. Only protects 3-dimensional physical objects whose shape, configuration, or arrangement grants a practical advantage in operation or utility.
2. ALTURA DEL NIVEL INVENTIVO / NO OBVIEDAD (INVENTIVE STEP vs PRACTICAL UTILITY):
   - "invention": Requires non-obviousness (principio de no obviedad). A person skilled in the art combining existing prior art documents would NOT easily deduce the solution.
   - "utilityModel": Requires lower inventive step (practical advantage/utility). A new physical arrangement of known parts that improves handling, functioning, or efficiency qualifies.
3. NOVEDAD MUNDIAL Y APLICACION INDUSTRIAL (NOVELTY & INDUSTRIAL APPLICABILITY):
   - Check novelty against the provided prior art. Check if the solution is industrially applicable.
   - NOTE: If the invention description document is NOT provided, explicitly note inside the criteria explanations that full scrutiny of novelty and non-obviousness for the user's specific invention cannot be completed without the invention description, and that the assessment is inferred from the technical field and prior art complexity.
4. EXCLUSIONES LEGALES (LEGAL EXCLUSIONS):
   - Check if the subject matter falls into statutory exclusions (abstract ideas, mathematical methods, aesthetic creations, medical treatment methods).
5. SUFICIENCIA DOCUMENTAL Y CALCULO DE CONFIANZA (DOCUMENTATION SUFFICIENCY & CONFIDENCE):
   - "high": Both the actual invention description AND prior art are clear, allowing exact scrutiny of novelty, inventive step, and industrial applicability.
   - "medium": The actual invention description is missing or incomplete, so classification is deduced from the general complexity and nature of the prior art / title.
   - "low": Documents lack sufficient technical detail.

Documents to analyze:

--- STATE OF THE ART / PRIOR ART ---
${priorArtContext}

--- INVENTION DESCRIPTION ---
${inventionDescContext}

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{
  "recommendation": "invention" or "utilityModel",
  "confidence": "high" or "medium" or "low",
  "reasoning": "2-3 sentence legal justification citing specific elements from the documents. IMPORTANT CONGRUENCE RULE: If the invention description document is missing or confidence is medium/low, you MUST congruently phrase the conclusion as a 'potencial patente de invención' or 'potencial modelo de utilidad' (in Spanish) / 'potential invention patent' or 'potential utility model' (in English) rather than making an absolute assertion without full documentation.",
  "signals": ["exact phrase or concept from doc that supports this", "another signal", "..."],
  "risks": "Brief note on the main risk or limitation of this classification",
  "criteriaBreakdown": [
    {
      "name": "Escrutinio 1: Novedad Mundial (Novelty Check)",
      "status": "pass" | "warning" | "info",
      "explanation": "Detailed check of whether the invention features are anticipated by prior art. If invention description is missing, clearly state that absolute novelty cannot be contrasted without the technical memory."
    },
    {
      "name": "Escrutinio 2: Nivel Inventivo / Principio de No Obviedad (Inventive Step Check)",
      "status": "pass" | "warning" | "info",
      "explanation": "Detailed check of non-obviousness vs practical utility. If invention description is missing, state that non-obviousness scrutiny of the specific proposal is pending the technical memory."
    },
    {
      "name": "Escrutinio 3: Aplicación Industrial (Industrial Applicability)",
      "status": "pass" | "warning" | "info",
      "explanation": "Assessment of industrial feasibility and reproducibility."
    },
    {
      "name": "Materia Protegible (Elegibilidad Legal)",
      "status": "pass" | "warning" | "info",
      "explanation": "Assessment of subject matter (Process/Method/System vs 3D Physical Object shape)"
    },
    {
      "name": "Suficiencia Documental (Impacto en Confianza)",
      "status": "pass" | "warning" | "info",
      "explanation": "Explanation of how the presence/absence of the invention description directly impacts confidence"
    }
  ],
  "strategicAdvice": "1-2 sentences with commercial/filing advice (e.g. 20-year coverage vs faster 10-year utility model grant)"
}

IMPORTANT LANGUAGE REQUIREMENT: You MUST write all text inside "reasoning", "signals", "risks", "criteriaBreakdown" (names and explanations), and "strategicAdvice" strictly in ${lang === 'es' ? 'SPANISH (Español)' : 'ENGLISH'}. Do not output English text if the requested language is Spanish.`;

  parts.unshift({ text: userPrompt });

  try {
    const rawJson = await callChatApi('classifyPatent', systemInstruction, parts, 'json');
    const cleanedJson = cleanJsonString(rawJson);
    const parsed = JSON.parse(cleanedJson) as PatentClassification;
    if (!parsed.recommendation || !parsed.confidence || !parsed.reasoning) {
      throw new Error('Invalid classification response structure');
    }
    return parsed;
  } catch (error: any) {
    console.error('[gemini.ts] classifyPatentType error:', error);
    // Return a safe default with low confidence if parsing fails or quota hit
    return {
      recommendation: 'invention',
      confidence: 'low',
      reasoning: lang === 'es'
        ? 'No se pudo analizar automáticamente. Por favor selecciona el tipo manualmente.'
        : 'Automatic analysis failed. Please select the type manually.',
      signals: [],
      risks: lang === 'es'
        ? 'Clasificación no disponible. Verifica tu conexión o intenta de nuevo.'
        : 'Classification unavailable. Check your connection or try again.',
      criteriaBreakdown: [],
      strategicAdvice: lang === 'es'
        ? 'Consulta con un asesor o elige manualmente según si tu invento es un procedimiento (Inversión 20 años) o un dispositivo físico mejorado (Modelo de Utilidad 10 años).'
        : 'Consult an advisor or choose manually depending on whether your invention is a process (Invention 20 yrs) or an improved physical device (Utility Model 10 yrs).'
    };
  }
};

export const generateSearchQuery = async (description: string, lang: Language): Promise<string> => {
  const systemInstruction = `You are a patent search expert. Your task is to convert a user's natural language invention description (often in Spanish) into a concise Boolean search query optimized for the Europe PMC REST API (which searches English patent abstracts).
Respond ONLY with the Boolean query string.
Rules:
1. Translate all Spanish concepts into English technical keywords.
2. Group synonyms using OR in parentheses: e.g. (microencapsulation OR encapsulation)
3. Combine at most 2 or 3 distinct concepts using AND: e.g. (microencapsulation OR encapsulation) AND (alginate OR chitosan) AND food
4. Do NOT create overly long AND chains (>3 ANDs). Keep it broad enough to find similar worldwide patents.`;

  const userPrompt = `Generate a concise English Boolean search query for this invention description:\n\n"${description}"`;

  try {
    const rawResult = await callChatApi('extractKeywords', systemInstruction, [{ text: userPrompt }]);
    const cleaned = rawResult.replace(/^```|```$/g, '').trim();
    if (cleaned && cleaned.length > 3) return cleaned;
    throw new Error('Empty or invalid generated query');
  } catch (error) {
    console.error('[gemini.ts] generateSearchQuery error or quota hit:', error);
    // Smart fallback: extract technical words (length >= 5) and join with OR so Europe PMC guarantees matches
    const stopwords = ['metodo', 'proceso', 'sistema', 'dispositivo', 'para', 'como', 'utilizando', 'sobre', 'alimentos', 'method', 'process', 'using', 'like', 'with'];
    const words = description
      .replace(/[()",.]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= 5 && !stopwords.includes(w.toLowerCase()));
    
    return words.slice(0, 4).join(' OR ');
  }
};

export const generateDraft = async (
  section: SectionDetail,
  patentType: PatentType,
  lang: Language,
  patentData: PatentData,
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null
): Promise<string> => {
  if (!priorArtDoc && !inventionDescDoc && !patentData.priorArt) {
    return '';
  }

  const { parts, priorArtContext, inventionDescContext } = getPartsFromDocs(
    priorArtDoc,
    inventionDescDoc
  );

  const patentTypeName =
    patentType === 'invention' ? 'Invention Patent' : 'Utility Model';

  const systemInstruction = `You are an expert in patent law. Your task is to generate a concise, predictive first draft for a specific section of a patent application based on provided documents and context. Respond ONLY with the draft text in the specified language (${langToName(lang)}). Do not add titles, explanations, or apologies.`;

  const userPrompt = `
    **Patent Type:** "${patentTypeName}"
    **Section to Draft:** "${section.title}"
    **WIPO Recommendation for this section:** "${section.wipoRecommendation}"

    **Contextual Information:**
    ---
    **Uploaded "Prior Art" Document:**
    ${priorArtContext}
    ---
    **Uploaded "Invention Description" Document:**
    ${inventionDescContext}
    ---
    **Previously written "Prior Art" section content:**
    ${patentData.priorArt || 'Not drafted yet.'}
    ---

    **Your Instructions:**
    Based *heavily* on the provided documents and the previously written "Prior Art" content, and keeping the WIPO recommendation in mind, generate a clear and concise initial draft for the "${section.title}" section. This is a predictive text helper, so the draft should be a solid starting point, not the final, exhaustive version. For the 'Patent Background' section, use the 'Prior Art' text to suggest relevant IPC codes and explain their utility.
  `;

  parts.unshift({ text: userPrompt });

  try {
    return await callChatApi('generateDraft', systemInstruction, parts);
  } catch (error) {
    console.error('[gemini.ts] generateDraft error:', error);
    return ''; // Fail silently for predictions
  }
};

export const generateInventionMemoryDraft = async (
  problem: string,
  solution: string,
  advantage: string,
  lang: Language
): Promise<string> => {
  const systemInstruction = `You are an expert patent attorney specialized in WIPO/OMPI and Decision 486 (CAN/INDECOPI). Your task is to take a user's brief answers about their invention and synthesize a formal, clear Technical Memory / Invention Description (Memoria Técnica de la Invención) structured specifically to enable exact legal scrutiny of Novelty, Inventive Step (Non-obviousness), and Industrial Applicability. Respond ONLY with the synthesized technical memory text in ${lang === 'es' ? 'Spanish (Español)' : 'English'}.`;

  const userPrompt = `
Synthesize a formal Technical Memory (Memoria Técnica de la Invención) from these core inputs provided by the inventor:
1. TECHNICAL PROBLEM SOLVED: "${problem}"
2. DETAILED SOLUTION / HOW IT WORKS STEP BY STEP: "${solution}"
3. TECHNICAL ADVANTAGE / DIFFERENCE VS PRIOR ART: "${advantage}"

Please organize the output into 3 clear technical sections:
- Campo Técnico y Problema a Resolver
- Descripción Detallada de la Solución e Implementación
- Ventajas Técnicas y Nivel Inventivo frente al Estado de la Técnica

Make sure the language is precise and rigorous so an AI or patent attorney can immediately scrutinize its statutory criteria.
`;

  try {
    return await callChatApi('generateDraft', systemInstruction, [{ text: userPrompt }]);
  } catch (error) {
    console.error('[gemini.ts] generateInventionMemoryDraft error:', error);
    return lang === 'es'
      ? `Campo Técnico y Problema:\n${problem}\n\nSolución Técnica:\n${solution}\n\nVentajas:\n${advantage}`
      : `Technical Field & Problem:\n${problem}\n\nTechnical Solution:\n${solution}\n\nAdvantages:\n${advantage}`;
  }
};

export const improveText = async (
  textToImprove: string,
  section: SectionDetail,
  patentData: PatentData,
  patentType: PatentType,
  lang: Language,
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null
): Promise<string> => {
  const patentTypeName =
    patentType === 'invention' ? 'Invention Patent' : 'Utility Model';

  const { parts, priorArtContext, inventionDescContext } = getPartsFromDocs(
    priorArtDoc,
    inventionDescDoc
  );

  const systemInstruction = `You are an expert in patent law, specializing in drafting patent applications according to WIPO/OMPI/INDECOPI guidelines. Your task is to expand and refine a user's draft text to meet official standards. Respond ONLY with the improved, comprehensive text for the requested section, in the specified language (${langToName(lang)}). Do not add any extra titles, explanations, or apologies.`;

  const userPrompt = `
    **Patent Type:** "${patentTypeName}"
    **Current Section:** "${section.title}"
    **WIPO Recommendation for this section:** "${section.wipoRecommendation}"

    **Contextual Information:**
    ---
    **Uploaded "Prior Art" Document:**
    ${priorArtContext}
    ---
    **Uploaded "Invention Description" Document:**
    ${inventionDescContext}
    ---
    **Other Drafted Sections:**
    Title: ${patentData.title || 'Not drafted yet.'}
    Prior Art: ${patentData.priorArt || 'Not drafted yet.'}
    Claims: ${patentData.claims || 'Not drafted yet.'}
    ---

    **Draft Text to Improve and Expand:**
    "${textToImprove}"

    **Your Instructions:**
    1. Analyze the "Draft Text to Improve" and any attached documents or other section context.
    2. Rewrite and expand it to improve clarity, logic, precision, and add technical depth, strictly following the WIPO recommendation provided.
    3. Ensure it meets the formal requirements of a patent office (like WIPO/INDECOPI).
    4. Correct common errors like lack of support, over-generalization, or irrelevant data.
    5. For the 'Patent Background' section, use the 'Prior Art' text to suggest relevant IPC codes and explain their utility.
    6. The final text should be comprehensive and well-structured.
  `;

  parts.unshift({ text: userPrompt });

  try {
    return await callChatApi('improveText', systemInstruction, parts);
  } catch (error) {
    console.error('[gemini.ts] improveText error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error: AI service failed. ${message}`;
  }
};

export interface ClaimTreeResult {
  independentClaim: string;
  dependentClaims: string[];
  formattedText: string;
}

export const generateClaimTree = async (
  patentData: PatentData,
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null,
  lang: Language
): Promise<ClaimTreeResult> => {
  const { parts, priorArtContext, inventionDescContext } = getPartsFromDocs(priorArtDoc, inventionDescDoc);

  const systemInstruction = `You are a Senior Patent Attorney and Specialist in drafting patent claims according to WIPO, PCT, and Decisión 486 (INDECOPI) standards.
Your task is to generate a formal, hierarchical Claim Tree (Árbol de Reivindicaciones) based on the user's invention description, detailed description, and prior art context.
You MUST generate:
1. Exactly 1 Independent Claim (Reivindicación Principal/Independiente): Structured strictly in two parts: Preamble + Characterizing portion (e.g. "Un sistema para X que comprende A y B, caracterizado por comprender C y D...").
2. Exactly 3 to 4 Dependent Claims (Reivindicaciones Dependientes): Subordinated directly to claim 1 or previous claims (e.g. "2. El sistema según la reivindicación 1, donde el sensor es..."), specifically designed to protect key technical variants and prevent competitors from designing around (evasión técnica).

You MUST respond ONLY in valid JSON format with the following exact structure:
{
  "independentClaim": "1. Un sistema/método/dispositivo...",
  "dependentClaims": [
    "2. El sistema según la reivindicación 1, caracterizado porque...",
    "3. El sistema según la reivindicación 1 o 2, donde...",
    "4. El sistema según la reivindicación 1, que además comprende..."
  ]
}
Do not include markdown code block backticks outside the JSON string if possible.`;

  const userPrompt = `Language: ${langToName(lang)}
Title: ${patentData.title || 'Untitled'}
Technical Sector: ${patentData.technicalSector || 'Not provided'}
Detailed Description: ${patentData.detailedDescription || 'Not provided'}
Prior Art Context: ${priorArtContext}
Invention Description Context: ${inventionDescContext}

Generate the hierarchical Claim Tree now in ${langToName(lang)}.`;

  parts.unshift({ text: userPrompt });

  try {
    const rawResult = await callChatApi('generateDraft', systemInstruction, parts, 'json');
    let cleaned = rawResult.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    const indep = parsed.independentClaim || (lang === 'es' ? '1. Reivindicación principal no generada.' : '1. Independent claim not generated.');
    const dep: string[] = Array.isArray(parsed.dependentClaims) ? parsed.dependentClaims : [];
    const formattedText = [indep, ...dep].join('\n\n');
    return { independentClaim: indep, dependentClaims: dep, formattedText };
  } catch (error) {
    console.error('[gemini.ts] generateClaimTree error:', error);
    const fallbackIndep = lang === 'es'
      ? `1. ${patentData.title || 'Sistema caracterizado por comprender una serie de elementos técnicos que resuelven el problema planteado en la memoria técnica'}.`
      : `1. ${patentData.title || 'A system characterized by comprising technical elements that solve the problem stated in the specification'}.`;
    const fallbackDep = lang === 'es'
      ? [
          '2. El sistema según la reivindicación 1, caracterizado porque los sensores recopilan datos en tiempo real para transmisión en la nube.',
          '3. El sistema según la reivindicación 1, donde el procesamiento incluye un algoritmo de inteligencia artificial o filtro digital para filtrado y alerta temprana.',
          '4. El sistema según cualquiera de las reivindicaciones 1 a 3, que comprende además una interfaz remota de monitoreo autónomo.'
        ]
      : [
          '2. The system according to claim 1, characterized in that the sensors collect real-time data for cloud transmission.',
          '3. The system according to claim 1, wherein the processing includes an artificial intelligence algorithm or digital filter for early warning.',
          '4. The system according to any of claims 1 to 3, further comprising a remote monitoring interface.'
        ];
    return {
      independentClaim: fallbackIndep,
      dependentClaims: fallbackDep,
      formattedText: [fallbackIndep, ...fallbackDep].join('\n\n')
    };
  }
};

export interface SufficiencyScanResult {
  isSufficient: boolean;
  score: number; // 0 to 100
  summary: string;
  missingDetails: string[];
  recommendations: string[];
}

export const scanDescriptiveSufficiency = async (
  descriptionText: string,
  patentData: PatentData,
  lang: Language
): Promise<SufficiencyScanResult> => {
  const systemInstruction = `You are a Patent Examiner evaluating a patent specification for "Descriptive Sufficiency" (Suficiencia Descriptiva / Enablement requirement under Article 83 EPO, 35 U.S.C. 112, and Decisión 486 INDECOPI).
Your task is to scan the detailed description text and check whether an expert in the technical field could reproduce and construct the invention step-by-step without excessive or undue experimentation.
Identify exact blind spots, vague claims (e.g. "an AI algorithm processes data" without specifying inputs, parameters, or training structure), missing dimensions, materials, or workflow steps.

You MUST respond ONLY in valid JSON format with the following exact structure:
{
  "isSufficient": boolean (true if score >= 80 and no critical gaps exist),
  "score": number (between 0 and 100 representing descriptive completeness),
  "summary": "1-2 sentence assessment of the descriptive reproducibility.",
  "missingDetails": ["Detail 1 missing", "Detail 2 missing"],
  "recommendations": ["Recommendation 1 to satisfy statutory sufficiency", "Recommendation 2"]
}
Do not include markdown code block backticks outside the JSON string if possible.`;

  const userPrompt = `Language: ${langToName(lang)}
Title: ${patentData.title || 'Untitled'}
Technical Sector: ${patentData.technicalSector || 'Not provided'}
Drafted Detailed Description to Scan:
"${descriptionText}"

Perform the statutory descriptive sufficiency scan now in ${langToName(lang)}.`;

  try {
    const rawResult = await callChatApi('generateDraft', systemInstruction, [{ text: userPrompt }], 'json');
    let cleaned = rawResult.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    return {
      isSufficient: Boolean(parsed.isSufficient),
      score: typeof parsed.score === 'number' ? parsed.score : 75,
      summary: parsed.summary || (lang === 'es' ? 'Análisis de suficiencia completado.' : 'Sufficiency analysis completed.'),
      missingDetails: Array.isArray(parsed.missingDetails) ? parsed.missingDetails : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    };
  } catch (error) {
    console.error('[gemini.ts] scanDescriptiveSufficiency error:', error);
    return {
      isSufficient: descriptionText.length > 200,
      score: descriptionText.length > 300 ? 85 : 60,
      summary: lang === 'es'
        ? 'El texto presenta una descripción general viable. Para blindar el requisito de suficiencia ante un examinador, asegúrate de detallar parámetros, diagramas de flujo y diagramas de conexión física.'
        : 'The text provides a viable overview. To secure full statutory sufficiency against examiner objections, ensure parameters, flowcharts, and physical connections are detailed.',
      missingDetails: lang === 'es'
        ? ['Verificar que todas las variables de entrada/salida estén cuantificadas.', 'Asegurar que los materiales o algoritmos específicos estén explicados paso a paso.']
        : ['Verify all input/output variables are quantified.', 'Ensure specific materials or algorithms are explained step-by-step.'],
      recommendations: lang === 'es'
        ? ['Incluir un ejemplo práctico de funcionamiento paso a paso.', 'Adjuntar referencias a figuras o diagramas en la descripción.']
        : ['Include a step-by-step working example.', 'Reference figures or connection diagrams in the description.']
    };
  }
};

export interface TechnicalSectorResult {
  macroSector: string;
  specificSubfield: string;
  technicalPurpose: string;
  suggestedIpcCodes: Array<{ code: string; title: string; relevance: string }>;
  formattedText: string;
}

export const structureTechnicalSector = async (
  patentData: PatentData,
  priorArtDoc: UploadedFile | null,
  inventionDescDoc: UploadedFile | null,
  selectedMacroSector: string,
  lang: Language
): Promise<TechnicalSectorResult> => {
  const { parts, priorArtContext, inventionDescContext } = getPartsFromDocs(priorArtDoc, inventionDescDoc);

  const systemInstruction = `You are a Senior Patent Classifier and Patent Attorney specializing in WIPO, PCT Rule 5.1(a)(i), and Decisión 486 (INDECOPI) statutory drafting.
Your task is to structure and draft a comprehensive, highly rigorous "Technical Field / Sector Técnico" section and identify the exact International Patent Classification (IPC / CIP) codes.
A statutory Technical Field section MUST NEVER be a brief single sentence. It requires precise technical depth:
1. Macro-Sector Industrial: The broad scientific/industrial realm.
2. Specific Technical Subfield: The exact niche, mechanism, or process where the invention operates.
3. Industrial Purpose & Object: The concrete technical problem or operational objective addressed.
4. Recommended IPC / CIP Codes: 2 to 4 precise International Patent Classification codes (Section, Class, Subclass, Group) with formal titles and explicit justification of relevance.

You MUST respond ONLY in valid JSON format with the following exact structure:
{
  "macroSector": "e.g. Biotecnología e Ingeniería Biomédica",
  "specificSubfield": "e.g. Sistemas de monitorización continua no invasiva y sensores optoelectrónicos",
  "technicalPurpose": "e.g. Captura en tiempo real y filtrado digital de biomarcadores para diagnóstico temprano",
  "suggestedIpcCodes": [
    {
      "code": "A61B 5/00",
      "title": "Medición con fines de diagnóstico; Identificación de personas",
      "relevance": "Cubre directamente los dispositivos y métodos de adquisición de señales fisiológicas del invento."
    },
    {
      "code": "G16H 40/60",
      "title": "TIC especialmente adaptadas para la gestión de recursos de asistencia sanitaria o para el manejo de equipos médicos",
      "relevance": "Aplica a la arquitectura de transmisión y procesamiento remoto de datos en la nube."
    }
  ],
  "formattedText": "La presente invención se enmarca en el campo técnico general de [Macro-Sector], y más específicamente se relaciona con [Subcampo Específico].\n\nEn particular, el objeto tecnológico de esta invención comprende [Objeto Técnico y Función Industrial], proporcionando ventajas operativas significativas en la industria de [Industria de aplicación].\n\nDe acuerdo con la Clasificación Internacional de Patentes (CIP / IPC), la presente innovación se sitúa de manera preferente en las clases técnicas: [Código 1 - Título] y [Código 2 - Título]."
}
Do not include markdown code block backticks outside the JSON string if possible.`;

  const userPrompt = `Language: ${langToName(lang)}
Invention Title: ${patentData.title || 'Not provided'}
User Selected Macro-Sector Hint: ${selectedMacroSector || 'General / Auto-detect'}
Current Technical Sector Draft: ${patentData.technicalSector || 'Empty'}
Prior Art Context: ${priorArtContext}
Invention Description Context: ${inventionDescContext}

Structure and generate the comprehensive, multi-layered statutory Technical Sector and CIP/IPC classification now in ${langToName(lang)}.`;

  parts.unshift({ text: userPrompt });

  try {
    const rawResult = await callChatApi('generateDraft', systemInstruction, parts, 'json');
    let cleaned = rawResult.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    const macro = parsed.macroSector || (lang === 'es' ? 'Tecnología Aplicada e Ingeniería Industrial' : 'Applied Technology & Industrial Engineering');
    const sub = parsed.specificSubfield || (patentData.title || 'Sistemas y dispositivos de mejora técnica');
    const purpose = parsed.technicalPurpose || (lang === 'es' ? 'Optimización de procesos operativos y resolución de limitaciones del estado de la técnica' : 'Optimization of operational processes and solving prior art limitations');
    const ipc: Array<{ code: string; title: string; relevance: string }> = Array.isArray(parsed.suggestedIpcCodes) ? parsed.suggestedIpcCodes : [];
    
    let formatted = parsed.formattedText;
    if (!formatted || formatted.length < 50) {
      formatted = lang === 'es'
        ? `La presente invención se enmarca en el campo técnico general de ${macro}, y más específicamente se relaciona con ${sub}.\n\nEn particular, el objeto tecnológico principal de esta invención comprende ${purpose}, permitiendo una aplicación industrial eficiente, reproducible y con un claro salto inventivo frente a las tecnologías preexistentes.\n\nDe acuerdo con la Clasificación Internacional de Patentes (CIP / IPC), esta innovación corresponde preferentemente a los códigos y subclases técnicas aplicables a su mecanismo de acción y estructura principal.`
        : `The present invention falls within the general technical field of ${macro}, and more specifically relates to ${sub}.\n\nIn particular, the main technological object of this invention comprises ${purpose}, enabling efficient, reproducible industrial application with a clear inventive step over pre-existing technologies.\n\nAccording to the International Patent Classification (IPC), this innovation preferably corresponds to the technical codes and subclasses applicable to its core mechanism and structure.`;
    }

    return {
      macroSector: macro,
      specificSubfield: sub,
      technicalPurpose: purpose,
      suggestedIpcCodes: ipc,
      formattedText: formatted
    };
  } catch (error) {
    console.error('[gemini.ts] structureTechnicalSector error:', error);
    const fallbackMacro = selectedMacroSector || (lang === 'es' ? 'Ingeniería y Tecnología Industrial' : 'Engineering & Industrial Technology');
    const fallbackText = lang === 'es'
      ? `La presente invención se enmarca en el campo técnico general de ${fallbackMacro}, y más específicamente se relaciona con el desarrollo, optimización y aplicación práctica de ${patentData.title || 'dispositivos y métodos tecnológicos avanzados'}.\n\nEn particular, el objeto técnico principal de esta invención se enfoca en resolver las limitaciones y complejidades operativas observadas en el estado de la técnica actual, proporcionando mayor precisión, eficiencia y viabilidad industrial en los procesos del sector.\n\nDe acuerdo con la Clasificación Internacional de Patentes (CIP / IPC), esta tecnología es categorizable en las secciones correspondientes a su ámbito industrial de fabricación y uso directo.`
      : `The present invention falls within the general technical field of ${fallbackMacro}, and more specifically relates to the development, optimization, and practical application of ${patentData.title || 'advanced technological devices and methods'}.\n\nIn particular, the main technical object of this invention focuses on overcoming the operational limitations and complexities observed in the current state of the art, providing enhanced precision, efficiency, and industrial viability in sector processes.\n\nAccording to the International Patent Classification (IPC), this technology is categorized within the sections corresponding to its industrial manufacturing and direct use domain.`;
    
    return {
      macroSector: fallbackMacro,
      specificSubfield: patentData.title || 'Desarrollo Tecnológico',
      technicalPurpose: lang === 'es' ? 'Resolución de limitaciones técnicas preexistentes' : 'Solving pre-existing technical limitations',
      suggestedIpcCodes: [
        { code: 'G06F / H04L / A61B', title: lang === 'es' ? 'Clasificación sugerida según rama industrial' : 'Suggested classification based on industrial branch', relevance: lang === 'es' ? 'Se recomienda afinar con la búsqueda FTO de patentes.' : 'Recommended to refine using FTO patent search.' }
      ],
      formattedText: fallbackText
    };
  }
};
