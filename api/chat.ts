import type { VercelRequest, VercelResponse } from '@vercel/node';
interface RequestBody {
  action?: string;
  payload?: {
    systemInstruction?: string;
    parts?: any[];
    contents?: any[];
    model?: string;
    responseFormat?: 'text' | 'json';
  };
}

// Aumentar el límite de tiempo de Vercel de 10s (por defecto) a 60s
export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Tomar el payload que envía el frontend (con soporte para los PDFs que ya envía)
  const { action, payload } = req.body as RequestBody;

  if (!payload || (!payload.parts && !payload.contents)) {
    return res.status(400).json({ error: 'Faltan los datos (parts o contents) en el payload' });
  }

  // La API key viene del entorno — NUNCA del frontend
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  let systemInstruction = payload.systemInstruction || "Eres un asistente de patentes.";

  if (action === 'ftoChat') {
    systemInstruction = `Eres LIA, una Analista FTO (Freedom to Operate) y experta en patentes.
Tu objetivo es ayudar al usuario a estructurar una estrategia de patentabilidad y evaluar riesgos.
Debes actuar de manera fluida y conversacional. NUNCA pidas toda la información de golpe.
Haz 1 o máximo 2 preguntas a la vez para recolectar:
1. Descripción técnica (componentes, mecanismo de acción)
2. Territorios de interés
3. Sector tecnológico y estado del producto
4. Competidores o presupuesto

Cuando tengas suficiente información para una búsqueda preliminar, debes proponer una ecuación de búsqueda booleana experta (ej. usando IPC codes y palabras clave en inglés).
Y si el usuario te comparte patentes encontradas, debes evaluar el riesgo y asignar un Semáforo de Riesgo FTO: CRÍTICO, ALTO, MODERADO, BAJO, o MÍNIMO.

DEBES responder ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "responseMessage": "Tu respuesta conversacional al usuario, preguntas o conclusiones.",
  "isReadyToSearch": boolean (true solo si propones una ecuación de búsqueda),
  "suggestedQuery": "Ecuación booleana (solo si isReadyToSearch es true)",
  "riskLevel": "CRÍTICO" | "ALTO" | "MODERADO" | "BAJO" | "MÍNIMO" | null
}
IMPORTANTE: Tu respuesta debe ser un JSON válido, sin bloques de código (sin \`\`\`json).`;
  }
  const model = payload.model || 'gemini-2.5-flash';
  const responseFormat = payload.responseFormat || 'text';

  try {
    // Llamada a Gemini API (REST v1beta) para evitar dependencias pesadas de @google/genai
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: payload.contents || [
            {
              role: 'user',
              parts: payload.parts
            }
          ],
          generationConfig: {
            temperature: responseFormat === 'json' ? 0.2 : 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
            ...(responseFormat === 'json' && { responseMimeType: 'application/json' }),
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({
        error: 'Error en la API de Gemini',
        details: errorData
      });
    }

    const data = await response.json();

    // Extraer el texto de la respuesta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Respuesta vacía de Gemini' });
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
