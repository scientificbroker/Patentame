import type { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
config({ path: '.env.local' });

interface RequestBody {
  action?: string;
  payload?: {
    systemInstruction?: string;
    parts?: any[];
    model?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Tomar el payload que envía el frontend (con soporte para los PDFs que ya envía)
  const { action, payload } = req.body as RequestBody;

  if (!payload || !payload.parts) {
    return res.status(400).json({ error: 'Faltan los datos (parts) en el payload' });
  }

  // La API key viene del entorno — NUNCA del frontend
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  // System instruction dinámica según la sección (proviene de geminiService.ts)
  const systemInstruction = payload.systemInstruction || "Eres un asistente de patentes.";
  const model = payload.model || 'gemini-2.5-flash';

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
          contents: [
            {
              role: 'user',
              parts: payload.parts
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
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
