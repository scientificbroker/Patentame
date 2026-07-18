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

export interface PatentClassification {
  recommendation: 'invention' | 'utilityModel';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  signals: string[];
  risks: string;
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

  const systemInstruction = `You are an expert patent attorney specialized in WIPO/OMPI/INDECOPI regulations. 
Your task is to analyze technical documents and classify the invention type using strict legal criteria.
You must respond ONLY with a valid JSON object, no markdown, no explanations outside the JSON.`;

  const userPrompt = `Analyze the following technical documents and determine whether this invention qualifies better as:
- "invention": An Invention Patent — requires an absolute inventive step (non-obvious solution to a technical problem), 
  can cover products, processes, methods, compositions, or systems. Protection: 20 years.
- "utilityModel": A Utility Model — covers practical improvements to existing tools, devices, or objects 
  (3-dimensional physical forms only). Lower inventive step required. Protection: 10 years.

Key criteria to evaluate:
1. INVENTIVE STEP: Is the solution non-obvious to someone skilled in the art? (High step → invention; Low step → utilityModel)
2. SUBJECT MATTER: Does it cover a process/method/composition/system? (→ invention) OR only a physical object shape? (→ utilityModel)
3. NOVELTY: Is it an absolute new solution or an improvement of something existing?
4. TECHNICAL SIGNALS: Look for keywords like "método", "proceso", "sistema", "composición", "síntesis" (→ invention) 
   vs "mejora de", "dispositivo modificado", "herramienta", "utensilio", "forma" (→ utilityModel)

Documents to analyze:

--- STATE OF THE ART / PRIOR ART ---
${priorArtContext}

--- INVENTION DESCRIPTION ---
${inventionDescContext}

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{
  "recommendation": "invention" or "utilityModel",
  "confidence": "high" or "medium" or "low",
  "reasoning": "2-3 sentence legal justification citing specific elements from the documents",
  "signals": ["exact phrase or concept from doc that supports this", "another signal", "..."],
  "risks": "Brief note on the main risk or limitation of this classification"
}`;

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
