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
  action: 'generateDraft' | 'improveText',
  systemInstruction: string,
  parts: Part[]
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload: { systemInstruction, parts } }),
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
