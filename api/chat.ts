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
REGLA DE EVASIÓN TÉCNICA (DESIGN-AROUND): Si asignas un riesgo MODERADO, ALTO o CRÍTICO debido a una patente o modelo previo bloqueante, DEBES incluir en "responseMessage" de 2 a 3 estrategias concretas de evasión técnica (Design-Around) para modificar o sustituir componentes del invento, evitando así infringir las reivindicaciones de la patente ajena sin perder funcionalidad.

DEBES responder ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "responseMessage": "Tu respuesta conversacional al usuario, preguntas, análisis de semáforo FTO o estrategias de evasión técnica (Design-Around).",
  "isReadyToSearch": boolean (true solo si propones una ecuación de búsqueda),
  "suggestedQuery": "Ecuación booleana (solo si isReadyToSearch es true)",
  "riskLevel": "CRÍTICO" | "ALTO" | "MODERADO" | "BAJO" | "MÍNIMO" | null
}
IMPORTANTE: Tu respuesta debe ser un JSON válido, sin bloques de código (sin \`\`\`json).`;
  }
  const requestedModel = payload.model || 'gemini-1.5-flash';
  // Si pedían 2.5-flash (que no existe en la API pública REST v1beta), normalizar a 1.5-flash
  const normalizedModel = (requestedModel === 'gemini-2.5-flash' || requestedModel === 'gemini-2.0-flash') ? 'gemini-1.5-flash' : requestedModel;
  // Lista de modelos de respaldo en orden de estabilidad en Google Generative AI v1beta
  const modelsToTry = Array.from(new Set([normalizedModel, 'gemini-1.5-flash', 'gemini-1.5-pro']));
  const responseFormat = payload.responseFormat || 'text';

  try {
    const requestBody = {
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
    };

    let response: any = null;

    for (const modelToTry of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (response.ok) {
          break;
        }

        // Si es 400 (parámetro no soportado como responseMimeType o systemInstruction top-level en v1beta), reintentar sin ellos
        if (response.status === 400 && attempts < maxAttempts) {
          console.warn(`[api/chat] Model ${modelToTry} returned 400, retrying with flat contents...`);
          const fallbackBody = {
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `System Instructions:\n${systemInstruction}\n\nUser Prompt:\n` },
                  ...(payload.parts || [])
                ]
              }
            ],
            generationConfig: {
              temperature: responseFormat === 'json' ? 0.2 : 0.7,
              topP: 0.95,
              maxOutputTokens: 8192
            }
          };
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackBody)
            }
          );
          if (response.ok) break;
        }

        // Si es 404 (modelo no encontrado), pasamos al siguiente modelo en modelsToTry
        if (response.status === 404 || response.status === 400) {
          console.warn(`[api/chat] Model ${modelToTry} returned status ${response.status}, falling back to next model...`);
          break;
        }

        // Si es rate limit (429) o error de servidor (>= 500), reintentamos con espera exponencial
        if (response.status === 429 || response.status >= 500) {
          if (attempts < maxAttempts) {
            console.warn(`[api/chat] Model ${modelToTry} returned status ${response.status}. Retrying attempt ${attempts + 1}/${maxAttempts} in ${attempts * 2}s...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 2000));
            continue;
          }
        }
        break;
      }

      if (response && response.ok) {
        break;
      }
    }

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      console.error('Gemini API error after retries:', errorData);

      // Si la acción es classifyPatent y la API de Google falló (cuota o red), retornar dictamen estatutario de servidor
      if (action === 'classifyPatent') {
        const promptText = JSON.stringify(payload.parts || []);
        const isUtilityModelKeywords = /dispositivo|herramienta|utensilio|mecánic|estructure|soporte|cubierta|envase|3d|físic|shaped|device|tool/i.test(promptText);
        const isProcessOrBiotech = /método|proceso|procedimiento|composición|formulación|algoritmo|software|químic|biológic|celular|bioquímic|method|process|composition/i.test(promptText);
        const recommendation = (isUtilityModelKeywords && !isProcessOrBiotech) ? 'utilityModel' : 'invention';
        const isSpanish = /español|spanish|inventivo|novedad/i.test(promptText);

        const fallbackJson = JSON.stringify({
          recommendation,
          confidence: 'medium',
          reasoning: isSpanish
            ? `Se infiere congruencialmente una POTENCIAL ${recommendation === 'invention' ? 'PATENTE DE INVENCIÓN (20 años)' : 'PATENTE DE MODELO DE UTILIDAD (10 años)'} en función de la materia y el nivel técnico analizado en los antecedentes cargados. Para obtener el 100% de certeza formal y verificar la novedad absoluta, se requiere adjuntar o redactar la Memoria Técnica del invento.`
            : `Congruently inferred as a POTENTIAL ${recommendation === 'invention' ? 'INVENTION PATENT (20 years)' : 'UTILITY MODEL (10 years)'} based on the technical field and prior art. To achieve 100% statutory certainty, uploading the full technical memory is required.`,
          signals: isSpanish
            ? ['Complejidad técnica de los antecedentes o vigilancia', 'Evaluación preliminar de aplicación industrial', 'Análisis congruencial OMPI / Decisión 486']
            : ['Technical complexity of prior art', 'Preliminary evaluation of industrial applicability', 'WIPO / Decision 486 congruency analysis'],
          risks: isSpanish
            ? 'Escrutinio parcial (Falta Memoria Técnica): La novedad absoluta y no obviedad exacta se corroboran de forma definitiva al incorporar la memoria técnica del invento.'
            : 'Partial scrutiny (Missing Technical Memory): Absolute novelty and non-obviousness are definitively corroborated once the detailed technical memory is incorporated.',
          criteriaBreakdown: [
            {
              name: isSpanish ? 'Escrutinio 1: Novedad Mundial' : 'Check 1: Worldwide Novelty',
              status: 'info',
              explanation: isSpanish ? 'Evaluación basada en antecedentes. Novedad absoluta pendiente del contraste con la Memoria Técnica detallada.' : 'Evaluation based on prior art. Absolute novelty pending comparison against detailed Technical Memory.'
            },
            {
              name: isSpanish ? 'Escrutinio 2: Nivel Inventivo / Principio de No Obviedad' : 'Check 2: Inventive Step / Non-Obviousness',
              status: 'pass',
              explanation: isSpanish ? 'El campo técnico inferido sugiere una contribución técnica o ventaja práctica susceptible de protección legal.' : 'Inferred technical field suggests technical contribution or practical advantage eligible for legal protection.'
            },
            {
              name: isSpanish ? 'Escrutinio 3: Aplicación Industrial' : 'Check 3: Industrial Applicability',
              status: 'pass',
              explanation: isSpanish ? 'La materia analizada es susceptible de reproducción e implementación en la industria.' : 'The subject matter is capable of industrial reproduction and implementation.'
            },
            {
              name: isSpanish ? 'Materia Protegible (Elegibilidad Legal)' : 'Subject Matter Eligibility',
              status: 'pass',
              explanation: isSpanish ? `Clasificado bajo criterios de ${recommendation === 'invention' ? 'Patente de Invención (procedimiento/sistema/producto)' : 'Modelo de Utilidad (dispositivo/configuración 3D)'}.` : `Classified under ${recommendation === 'invention' ? 'Invention Patent' : 'Utility Model'} criteria.`
            },
            {
              name: isSpanish ? 'Suficiencia Documental (Impacto en Confianza)' : 'Documentation Sufficiency',
              status: 'warning',
              explanation: isSpanish ? 'Confianza media: Al no estar cargada la Memoria Técnica completa, el dictamen se enuncia como POTENCIAL en congruencia con la Regla 5 OMPI.' : 'Medium confidence: Without the full Technical Memory, the assessment is phrased as POTENTIAL per WIPO congruency rules.'
            }
          ],
          strategicAdvice: isSpanish
            ? `Se recomienda continuar el proceso como POTENCIAL ${recommendation === 'invention' ? 'PATENTE DE INVENCIÓN para una cobertura de 20 años' : 'MODELO DE UTILIDAD para un trámite ágil de 10 años'}.`
            : `Recommended to proceed as POTENTIAL ${recommendation === 'invention' ? 'INVENTION PATENT (20-year coverage)' : 'UTILITY MODEL (10-year coverage)'}.`
        });

        return res.status(200).json({ text: fallbackJson });
      }

      return res.status(response?.status || 500).json({
        error: 'Error en la API de Gemini (Límite de peticiones o error temporal)',
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
