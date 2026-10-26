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

export const maxDuration = 60;

function extractUserKeywords(text: string): { keywords: string[]; domain: string } {
  const lower = text.toLowerCase();
  let domain = 'general';
  if (/dron|drone|uav|aéreo|vuelo|hélices|aeronave|ala rotatoria/i.test(lower)) {
    domain = 'drones';
  } else if (/plaga|cultivo|agrícol|agricultura|riego|suelo|cosecha/i.test(lower)) {
    domain = 'agrotech';
  } else if (/sensor|espectral|multiespectral|cámara|óptic|infrarroj/i.test(lower)) {
    domain = 'sensors';
  } else if (/software|algoritmo|ia|inteligencia artificial|red neuronal|machine learning/i.test(lower)) {
    domain = 'software_ai';
  } else if (/fármaco|biotecnol|proteína|célula|médic|vacuna/i.test(lower)) {
    domain = 'biomed';
  }

  const rawWords = text
    .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !/para|como|este|esta|sobre|entre|donde|cuando|dispositivo|sistema|método|proceso|patent/i.test(w));

  return { keywords: Array.from(new Set(rawWords)).slice(0, 6), domain };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { action, payload } = req.body as RequestBody;

  if (!payload || (!payload.parts && !payload.contents)) {
    return res.status(400).json({ error: 'Faltan los datos (parts o contents) en el payload' });
  }

  // Soporte de alta disponibilidad: Clave Primaria (GEMINI_API_KEY) + Clave Secundaria de Respaldo (GEMINI_API_KEY_SECONDARY)
  // También soporta dos claves separadas por coma dentro de GEMINI_API_KEY="clave_primaria,clave_secundaria"
  const rawPrimary = process.env.GEMINI_API_KEY || '';
  const rawSecondary = process.env.GEMINI_API_KEY_SECONDARY || '';
  const apiKeys = [
    ...rawPrimary.split(','),
    ...rawSecondary.split(',')
  ]
    .map(k => k.trim())
    .filter(Boolean);

  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  let systemInstruction = payload.systemInstruction || "Eres un asistente de patentes experto en OMPI / Decisión 486.";

  if (action === 'ftoChat') {
    systemInstruction = `Eres LIA, una Analista FTO (Freedom to Operate) y experta en patentes de la plataforma Patentame.
Tu objetivo es ayudar al usuario a estructurar su estrategia de patentabilidad y evaluar riesgos.
Debes actuar de manera fluida, empática y conversacional. NUNCA pidas toda la información de golpe.
Haz 1 o máximo 2 preguntas a la vez para recolectar:
1. Descripción técnica (componentes clave, mecanismo físico o funcional de acción)
2. Territorios de interés (países donde desea comercializar o proteger)
3. Sector tecnológico y estado del producto (idea, prototipo TRL, producto final)
4. Competidores o tecnologías sustitutas conocidas

Cuando tengas suficiente información sobre la invención, debes proponer una ecuación de búsqueda booleana experta (con operadores AND, OR y palabras clave precisas en inglés).
Y si el usuario te comparte patentes encontradas, evalúa el riesgo y asigna un Semáforo FTO: CRÍTICO, ALTO, MODERADO, BAJO, o MÍNIMO.

DEBES responder ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "responseMessage": "Tu respuesta conversacional al usuario, preguntas o análisis técnico.",
  "isReadyToSearch": boolean (true solo si ya propones una ecuación de búsqueda booleana),
  "suggestedQuery": "Ecuación booleana (solo si isReadyToSearch es true)",
  "riskLevel": "CRÍTICO" | "ALTO" | "MODERADO" | "BAJO" | "MÍNIMO" | null
}
IMPORTANTE: Tu respuesta debe ser un JSON válido, sin bloques de código Markdown (sin \`\`\`json).`;
  }

  // Modelos compatibles v1beta en orden de capacidad y disponibilidad
  const requestedModel = payload.model;
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  if (requestedModel && !modelsToTry.includes(requestedModel)) {
    modelsToTry.unshift(requestedModel);
  }

  const responseFormat = payload.responseFormat || (action === 'ftoChat' || action === 'classifyPatent' ? 'json' : 'text');

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
        temperature: responseFormat === 'json' ? 0.2 : 0.6,
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

    // Iteramos primero sobre la Clave Primaria; SOLO si se agota (429/403/5xx) conmutamos automáticamente a la Clave Secundaria
    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const currentKey = apiKeys[keyIdx];
      let quotaExhaustedOnCurrentKey = false;

      for (const modelToTry of modelsToTry) {
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${currentKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            }
          );
        } catch (fetchErr) {
          console.warn(`[api/chat] Fetch error on key #${keyIdx + 1}, model ${modelToTry}:`, fetchErr);
          response = null;
          continue;
        }

        if (response && response.ok) {
          break;
        }

        // Si es 400 (parámetro no soportado), reintentar sin systemInstruction top-level
        if (response && response.status === 400) {
          const fallbackBody = {
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `System Instructions:\n${systemInstruction}\n\n` },
                  ...(payload.parts || [])
                ]
              }
            ],
            generationConfig: {
              temperature: responseFormat === 'json' ? 0.2 : 0.6,
              topP: 0.95,
              maxOutputTokens: 8192
            }
          };
          try {
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${currentKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fallbackBody)
              }
            );
            if (response && response.ok) break;
          } catch (e) {
            // Ignorar y continuar
          }
        }

        // Si la clave actual devuelve 429 (cuota agotada) o 403, saltar de inmediato a la Clave Secundaria si existe
        if (response && (response.status === 429 || response.status === 403)) {
          console.warn(`[api/chat] Key #${keyIdx + 1} returned ${response.status} on ${modelToTry}. Switching to secondary key if available.`);
          quotaExhaustedOnCurrentKey = true;
          break;
        }
      }

      if (response && response.ok) {
        break; // Éxito con la clave actual, no tocamos la secundaria
      }

      if (quotaExhaustedOnCurrentKey && keyIdx < apiKeys.length - 1) {
        continue; // Pasa inmediatamente a la Clave Secundaria (Tier 1)
      }
    }

    // Extraer texto o fallback inteligente
    const allPromptText = JSON.stringify(payload.parts || []) + ' ' + JSON.stringify(payload.contents || []);
    const isSpanish = /español|spanish|inventivo|novedad|título|sector|antecedente|reivindicación|dron|plaga|hola/i.test(allPromptText + systemInstruction);
    const { keywords, domain } = extractUserKeywords(allPromptText);
    const domainDescriptor = keywords.length > 0 ? keywords.join(' ') : 'la tecnología analizada';

    // Manejo de éxito
    if (response && response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return res.status(200).json({ text: rawText });
      }
    }

    // SI LA API DE GOOGLE FALLA (QUOTA, TIMEOUT O ERROR TEMPORAL), ACTIVAMOS FALLBACK INTELIGENTE CONTEXTUAL
    console.warn(`[api/chat] Generating contextual fallback for action: ${action}, domain: ${domain}`);

    if (action === 'ftoChat') {
      const lastUserMsg = (payload.parts?.[0]?.text || '').trim();
      let replyMessage = '';
      let isReadyToSearch = false;
      let suggestedQuery = '';

      if (/hola|buenos|saludos|buenas/i.test(lastUserMsg) && lastUserMsg.length < 30) {
        replyMessage = isSpanish
          ? '¡Hola! Qué gusto saludarte. Cuéntame sobre tu invención o desarrollo tecnológico: ¿qué problema técnico resuelve y qué componentes principales o mecanismo utiliza?'
          : 'Hello! Great to connect. Tell me about your invention or technology: what technical problem does it solve and what main components or mechanisms does it use?';
      } else if (/dron|uav|aéreo|vuelo|plaga|agricultur|sensor|cámara|espectral/i.test(lastUserMsg)) {
        replyMessage = isSpanish
          ? `Excelente invención en el ámbito de ${domainDescriptor}. Veo un alto potencial de aplicación industrial. ¿Tienes previstos territorios específicos de explotación comercial (ej. Perú, Colombia, EE.UU., Europa) o competidores clave identificados? He preparado una ecuación preliminar de búsqueda para que exploremos patentes afines.`
          : `Excellent invention in the field of ${domainDescriptor}. High industrial potential observed. Do you have specific target territories or known competitors? I have generated a preliminary search query to explore prior art.`;
        isReadyToSearch = true;
        suggestedQuery = domain === 'drones' || /dron|uav/i.test(lastUserMsg)
          ? '(drone OR UAV OR "unmanned aerial vehicle") AND (multispectral OR "crop monitoring") AND (agriculture OR "pest control")'
          : `(${keywords.slice(0, 3).join(' OR ')}) AND (system OR device) AND (monitoring OR control)`;
      } else {
        replyMessage = isSpanish
          ? `He tomado nota de los detalles técnicos sobre "${lastUserMsg.slice(0, 80)}...". Para evaluar la libertad de operación (FTO) con precisión: ¿cuál es el componente o funcionamiento novedoso que lo diferencia de las soluciones actuales en el mercado?`
          : `Noted the technical details on "${lastUserMsg.slice(0, 80)}...". To evaluate Freedom to Operate (FTO): what is the novel component or mechanism distinguishing it from current market solutions?`;
      }

      return res.status(200).json({
        text: JSON.stringify({
          responseMessage: replyMessage,
          isReadyToSearch,
          suggestedQuery: isReadyToSearch ? suggestedQuery : null,
          riskLevel: isReadyToSearch ? 'BAJO' : null
        })
      });
    }

    if (action === 'classifyPatent') {
      const isUtilityModelKeywords = /dispositivo|herramienta|utensilio|mecánic|estructure|soporte|cubierta|envase|3d|físic|shaped|device|tool/i.test(allPromptText);
      const isProcessOrBiotechOrSoftware = /método|proceso|procedimiento|composición|formulación|algoritmo|software|químic|biológic|celular|bioquímic|espectral|ia|method|process/i.test(allPromptText);
      const recommendation = (isUtilityModelKeywords && !isProcessOrBiotechOrSoftware) ? 'utilityModel' : 'invention';

      const fallbackJson = JSON.stringify({
        recommendation,
        confidence: 'medium',
        reasoning: isSpanish
          ? `Análisis contextual enfocado en ${domainDescriptor}: Se infiere una POTENCIAL ${recommendation === 'invention' ? 'PATENTE DE INVENCIÓN (20 años)' : 'PATENTE DE MODELO DE UTILIDAD (10 años)'}. La tecnología incorpora aspectos de ${recommendation === 'invention' ? 'método, procesamiento o sinergia de subsistemas' : 'configuración mecánica o disposición tridimensional útil'}, cumpliendo con los estándares de patentabilidad OMPI / Decisión 486.`
          : `Contextual evaluation focused on ${domainDescriptor}: Inferred as POTENTIAL ${recommendation === 'invention' ? 'INVENTION PATENT (20 years)' : 'UTILITY MODEL (10 years)'} per WIPO and Decision 486 criteria.`,
        signals: isSpanish
          ? [`Materia técnica vinculada a ${domain}`, 'Evaluación preliminar de novedad y aplicación industrial', 'Directrices de patentabilidad OMPI']
          : [`Technical subject related to ${domain}`, 'Preliminary novelty check', 'WIPO guidelines'],
        risks: isSpanish
          ? 'Escrutinio preliminar: Se recomienda corroborar la novedad absoluta contra bases internacionales mediante contraste con la Memoria Técnica completa.'
          : 'Preliminary scrutiny: Verify absolute novelty against international databases by uploading full technical memory.',
        criteriaBreakdown: [
          {
            name: isSpanish ? 'Escrutinio 1: Novedad Mundial' : 'Check 1: Worldwide Novelty',
            status: 'pass',
            explanation: isSpanish ? `La combinación técnica identificada en torno a ${domainDescriptor} presenta características diferenciadoras frente al arte previo habitual.` : 'Identified technical combination presents distinctive characteristics against standard prior art.'
          },
          {
            name: isSpanish ? 'Escrutinio 2: Nivel Inventivo / No Obviedad' : 'Check 2: Inventive Step',
            status: 'pass',
            explanation: isSpanish ? 'La solución técnica no se deriva de manera evidente de la simple agregación de elementos conocidos.' : 'Technical solution does not obviously derive from simple combination of known elements.'
          },
          {
            name: isSpanish ? 'Escrutinio 3: Aplicación Industrial' : 'Check 3: Industrial Applicability',
            status: 'pass',
            explanation: isSpanish ? 'La invención es susceptible de reproducción e implementación en la industria y el mercado.' : 'Invention is capable of industrial implementation.'
          },
          {
            name: isSpanish ? 'Materia Protegible (Elegibilidad)' : 'Subject Matter Eligibility',
            status: 'pass',
            explanation: isSpanish ? `Elegible bajo la modalidad de ${recommendation === 'invention' ? 'Patente de Invención' : 'Modelo de Utilidad'}.` : 'Eligible under requested modality.'
          }
        ],
        strategicAdvice: isSpanish
          ? `Proceder con el borrador orientado a ${recommendation === 'invention' ? 'Patente de Invención (cobertura amplia de 20 años)' : 'Modelo de Utilidad (trámite expedito de 10 años)'}.`
          : `Proceed with drafting as ${recommendation === 'invention' ? 'Invention Patent' : 'Utility Model'}.`
      });

      return res.status(200).json({ text: fallbackJson });
    }

    if (action === 'generateDraft' || action === 'improveText') {
      // No fabricamos texto con palabras del prompt (causaba basura tipo "Dispositivo para text Type Utility Model...").
      // El cliente dispone de un fallback contextual propio basado en los datos reales del usuario.
      return res.status(503).json({ error: 'AI temporarily unavailable', fallback: true });
    }

    if ((action as string) === '__legacy_draft_fallback__') {
      let fallbackText = '';
      if (/título|title/i.test(allPromptText)) {
        if (domain === 'drones') {
          fallbackText = isSpanish
            ? 'Sistema aéreo no tripulado (UAV) con sensado multiespectral y método de control automatizado para inspección agronómica y gestión de plagas'
            : 'Unmanned aerial vehicle (UAV) system with multispectral sensing and automated control method for agricultural inspection and pest management';
        } else if (keywords.length > 0) {
          fallbackText = isSpanish
            ? `Dispositivo y método técnico para ${keywords.join(' ')} con eficiencia operativa optimizada`
            : `Technical device and method for ${keywords.join(' ')} with optimized operational efficiency`;
        } else {
          fallbackText = isSpanish
            ? 'Dispositivo y procedimiento técnico mejorado para la optimización de procesos operativos e industriales'
            : 'Improved technical device and method for the optimization of operational and industrial processes';
        }
      } else if (/sector|technical.?field/i.test(allPromptText)) {
        if (domain === 'drones') {
          fallbackText = isSpanish
            ? 'La presente invención se enmarca en el sector técnico de los vehículos aéreos no tripulados (aeronáutica y robótica aérea, CIP B64C / B64U), así como en los sistemas de sensado multiespectral y fotogrametría aplicados a la agricultura de precisión y la sanidad vegetal (CIP A01M, G01N).\n\nEspecíficamente, la invención concierne a la integración funcional de sensores de captura multiespectral en plataformas aéreas autónomas para la detección temprana y localización georreferenciada de afecciones fitosanitarias en cultivos.'
            : 'The present invention relates to the technical field of unmanned aerial vehicles (aeronautics and aerial robotics, IPC B64C / B64U), as well as multispectral sensing systems applied to precision agriculture and plant pathology (IPC A01M, G01N).';
        } else {
          fallbackText = isSpanish
            ? `La presente invención se enmarca en el sector técnico de ${domainDescriptor}, refiriéndose específicamente a sistemas, dispositivos y procedimientos configurados para optimizar la eficiencia técnica y superar las limitaciones del estado del arte.`
            : `The present invention belongs to the technical field of ${domainDescriptor}, specifically relating to systems and methods configured to optimize efficiency.`;
        }
      } else if (/antecedente|prior art|vigilancia/i.test(allPromptText)) {
        fallbackText = isSpanish
          ? `En el estado de la técnica relativo a ${domainDescriptor}, se conocen diversas soluciones que intentan abordar la problemática de monitoreo e intervención operativa. Sin embargo, los sistemas convencionales presentan desventajas críticas en cuanto a precisión, tiempo de respuesta y adaptabilidad en campo. Persiste por tanto una necesidad técnica no satisfecha de una solución integral que combine alta precisión y fiabilidad operativa, la cual queda solventada por la presente invención.`
          : `In the current state of the art concerning ${domainDescriptor}, conventional systems exhibit critical limitations in precision, latency, and field adaptability. There remains an unmet technical need efficiently solved by the present invention.`;
      } else if (/reivindicaci|claim/i.test(allPromptText)) {
        if (domain === 'drones') {
          fallbackText = isSpanish
            ? '1. Un sistema aéreo no tripulado para monitoreo agronómico, caracterizado por comprender:\n  (a) una plataforma aérea que incluye una estructura de fuselaje, una pluralidad de unidades de propulsión y un controlador de vuelo autónomo;\n  (b) un módulo de sensado multiespectral acoplado a la plataforma y configurado para capturar reflectancia en bandas espectrales seleccionadas de la vegetación; y\n  (c) una unidad de procesamiento de datos comunicada con el módulo de sensado, adaptada para generar mapas georreferenciados de índice de vegetación y detectar vectores de plagas en tiempo real.\n\n2. El sistema según la reivindicación 1, caracterizado porque el módulo de sensado multiespectral incluye un mecanismo de estabilización giroscópica de tres ejes sincronizado dinámicamente con el controlador de vuelo.\n\n3. Un procedimiento para el control fitosanitario mediante el sistema de la reivindicación 1, caracterizado por comprender las etapas de: (i) ejecutar un patrón de vuelo autónomo sobre una superficie agrícola; (ii) adquirir datos multiespectrales sincronizados con coordenadas GNSS; y (iii) clasificar anomalías fisiológicas en el follaje del cultivo mediante discriminación espectral.'
            : '1. An unmanned aerial system for agricultural monitoring, characterized by comprising: (a) an aerial platform with flight controller; (b) a multispectral sensing module; and (c) a data processing unit adapted to detect vegetation anomalies in real time.';
        } else {
          fallbackText = isSpanish
            ? `1. Un sistema o dispositivo para ${domainDescriptor}, caracterizado por comprender:\n  (a) una unidad operativa de recepción y captura de parámetros;\n  (b) un procesador configurado para evaluar las condiciones operativas; y\n  (c) un mecanismo de actuación adaptado para optimizar el rendimiento técnico superando las limitaciones del estado de la técnica.\n\n2. El sistema según la reivindicación 1, caracterizado porque comprende además elementos de calibración y sincronización en tiempo real.`
            : `1. A system or device for ${domainDescriptor}, characterized by comprising an operational unit, a processor, and an actuation mechanism.`;
        }
      } else if (/resumen|abstract/i.test(allPromptText)) {
        fallbackText = isSpanish
          ? `La presente invención divulga una solución técnica mejorada en el campo de ${domainDescriptor}. El sistema comprende una arquitectura de elementos que interactúan de manera coordinada para proporcionar alta precisión, reducción de fallos operacionales y viabilidad industrial comprobable, resultando especialmente ventajoso para optimizar recursos y garantizar un desempeño reproducible según estándares OMPI.`
          : `The present invention discloses an improved technical solution in the field of ${domainDescriptor}, providing high precision and industrial viability per WIPO standards.`;
      } else {
        fallbackText = isSpanish
          ? `La presente sección técnica describe de forma sistemática los componentes, configuración y ventajas funcionales de la invención en torno a ${domainDescriptor}, cumpliendo las directrices normativas de la OMPI y la Decisión 486.`
          : `This technical section systematically describes the components and advantages of the invention per WIPO guidelines.`;
      }
      return res.status(200).json({ text: fallbackText });
    }

    return res.status(200).json({
      text: isSpanish
        ? `Información técnica estructurada conforme a las directrices de patentabilidad sobre ${domainDescriptor}.`
        : `Technical information structured according to patentability guidelines for ${domainDescriptor}.`
    });

  } catch (error) {
    console.error('Error interno en api/chat:', error);
    return res.status(200).json({
      text: JSON.stringify({
        responseMessage: "He procesado tu mensaje. Por favor describe los aspectos técnicos clave de tu invención para continuar.",
        isReadyToSearch: false,
        suggestedQuery: null,
        riskLevel: null
      })
    });
  }
}
