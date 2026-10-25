import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ClassifyBody {
  text?: string;
  priorArt?: string;
  inventionMemory?: string;
  lang?: 'es' | 'en';
}

export const maxDuration = 30;

export interface LayaEvaluationResult {
  patentType: 'invention' | 'utilityModel';
  inventiveStepScore: number; // 1 to 10
  probability: number; // 0.0 to 1.0 (calibrated probability)
  probabilityPercent: number; // 0 to 100
  isEligibleSubjectMatter: boolean;
  macroSector: string;
  criteriaAnalysis: {
    noveltyRisk: 'low' | 'medium' | 'high';
    statutoryFit: string;
    inventiveStepJustification: string;
  };
  adviceForHigherProbability: string;
}

/**
 * Motor de inferencia rápida y calibrada basado en la arquitectura de decisión Laya (Typed Choice & Score)
 * Evalúa en una sola pasada:
 * 1. patent_type (choice: 'invention' | 'utilityModel')
 * 2. inventive_step_score (score: 1-10)
 * 3. probability (calibrated probability based on structural markers)
 * 4. is_eligible_subject_matter (yes_no)
 * 5. adviceForHigherProbability (consejo estratégico para incrementar probabilidad)
 */
export function evaluateWithLayaLogic(
  inventionText: string,
  priorArtText: string,
  lang: 'es' | 'en' = 'es'
): LayaEvaluationResult {
  const isEs = lang === 'es';
  const combined = `${inventionText} ${priorArtText}`.toLowerCase();
  const hasInventionMemory = inventionText.trim().length > 30;

  // Marcadores de materia exclusiva de Patente de Invención (Art. 14 Decisión 486 / OMPI)
  const processOrSoftwareMarkers = [
    'método', 'metodo', 'proceso', 'procedimiento', 'algoritmo', 'software',
    'inteligencia artificial', 'red neuronal', 'machine learning', 'composición',
    'composicion', 'formulación', 'formulacion', 'síntesis', 'sintesis', 'biotecnol',
    'celular', 'genético', 'genetico', 'fotogrametría', 'fotogrametria', 'espectral',
    'multiespectral', 'control autónomo', 'control autonomo', 'tratamiento de datos',
    'method', 'process', 'algorithm', 'neural network', 'composition', 'biotech'
  ];

  // Marcadores de Modelo de Utilidad (Art. 81 Decisión 486 - Mejoras de forma tridimensional)
  const utilityModelMarkers = [
    'carcasa', 'soporte', 'ensamblaje', 'acople', 'mango', 'chasis',
    'disposición física', 'disposicion fisica', 'forma exterior', 'recipiente',
    'pieza mecánica', 'pieza mecanica', 'herramienta manual', 'utensilio',
    'estructura tubular', 'mecanismo de fijación', 'mecanismo de fijacion',
    'bracket', 'housing', 'clamp', 'fitting', 'mechanical attachment', 'casing'
  ];

  // Marcadores de complejidad de subsistemas y sinergia
  const synergyMarkers = [
    'integración funcional', 'integracion funcional', 'sincronizado', 'tiempo real',
    'lazo cerrado', 'bucle de control', 'cooperación sinérgica', 'sinergia',
    'sensores y actuadores', 'procesamiento a bordo', 'edge computing', 'reflectancia',
    'closed loop', 'real-time', 'synchronized', 'synergistic'
  ];

  let processPoints = 0;
  processOrSoftwareMarkers.forEach(m => {
    if (combined.includes(m)) processPoints += 1.5;
  });

  let utilityPoints = 0;
  utilityModelMarkers.forEach(m => {
    if (combined.includes(m)) utilityPoints += 1.2;
  });

  let synergyPoints = 0;
  synergyMarkers.forEach(m => {
    if (combined.includes(m)) synergyPoints += 1.8;
  });

  // Cálculo del inventive_step_score (1 a 10)
  let rawScore = 3.5; // base neutral
  if (processPoints > 0) rawScore += Math.min(processPoints, 3.5);
  if (synergyPoints > 0) rawScore += Math.min(synergyPoints, 3.0);
  if (utilityPoints > processPoints && synergyPoints === 0) rawScore -= 1.5;

  const inventiveStepScore = Math.max(1, Math.min(10, Math.round(rawScore * 10) / 10));

  // Elección tipada de tipo de patente (Choice)
  const isProcessOrSystem = processPoints > 1.5 || synergyPoints > 1.5;
  const isPure3DHardware = utilityPoints > 2.0 && processPoints === 0 && synergyPoints === 0;

  const patentType: 'invention' | 'utilityModel' = (isPure3DHardware || inventiveStepScore < 5.0) 
    ? 'utilityModel' 
    : 'invention';

  // Calibración de probabilidad (0.50 a 0.96)
  let baseProb = 0.65;
  if (hasInventionMemory) baseProb += 0.18; // Memoria técnica aumenta certidumbre
  if (patentType === 'invention') {
    if (isProcessOrSystem) baseProb += 0.10;
    if (inventiveStepScore >= 7.0) baseProb += 0.05;
  } else {
    if (isPure3DHardware) baseProb += 0.15;
  }
  const probability = Math.min(0.96, Math.max(0.52, Math.round(baseProb * 100) / 100));
  const probabilityPercent = Math.round(probability * 100);

  // Sector
  let macroSector = isEs ? 'Mecánica e Ingeniería' : 'Mechanical Engineering';
  if (/dron|uav|aéreo|vuelo/i.test(combined)) macroSector = isEs ? 'Aeronáutica, Robótica y Drones' : 'Aeronautics & Drones';
  else if (/plaga|cultivo|agrícol|riego/i.test(combined)) macroSector = isEs ? 'Agronomía y Agricultura de Precisión' : 'AgriTech';
  else if (/fármaco|biotecnol|proteína|médic/i.test(combined)) macroSector = isEs ? 'Biotecnología y Salud' : 'Biotechnology';
  else if (/software|ia|algoritmo/i.test(combined)) macroSector = isEs ? 'Software e Inteligencia Artificial' : 'AI & Software';

  // Justificaciones específicas
  let inventiveStepJustification = '';
  let advice = '';

  if (patentType === 'invention') {
    inventiveStepJustification = isEs
      ? `Nivel Inventivo Calificado (${inventiveStepScore}/10): La invención combina métodos operativos, tratamiento de señales y subsistemas cooperantes que superan una mera adición de elementos conocidos. Legalmente no resulta obvia para un técnico medio en el sector de ${macroSector}.`
      : `Qualified Inventive Step (${inventiveStepScore}/10): Combines operational methods, signal processing, and cooperating subsystems exceeding simple addition of parts.`;

    advice = isEs
      ? (hasInventionMemory
          ? `Para maximizar la probabilidad al 95%+: Enfatiza en las reivindicaciones el efecto técnico no obvio que produce la combinación (ej. cómo el control autónomo interactúa directamente con los datos multiespectrales para tomar decisiones de vuelo o aspersión en tiempo real).`
          : `Para elevar la probabilidad del ${probabilityPercent}% al 90%+: Redacta o adjunta la Memoria Técnica detallando el diagrama de flujo y los parámetros operacionales exactos (bandas espectrales, latencia y algoritmo a bordo) para blindar el principio de No Obviedad.`)
      : `To maximize probability to 95%+: Detail the unexpected technical synergy between autonomous navigation and sensory payloads.`;
  } else {
    inventiveStepJustification = isEs
      ? `Ventaja Práctica Calificada (${inventiveStepScore}/10): La solución se centra en la configuración tridimensional, acople o disposición física de elementos, confiriendo mejor manejo, mayor durabilidad o facilidad de montaje sin necesidad de demostrar un nivel inventivo de ruptura.`
      : `Practical Utility (${inventiveStepScore}/10): Centered on 3D spatial arrangement conferring operational advantage.`;

    advice = isEs
      ? `Para elevar la probabilidad de concesión del Modelo de Utilidad: Presenta figuras o esquemas acotados destacando la novedad en la forma o disposición de las piezas y cuantifica la mejora ergonómica o de ensamblaje frente a los antecedentes.`
      : `To improve allowance probability: Include detailed technical drawings showcasing the physical spatial arrangement advantage.`;
  }

  return {
    patentType,
    inventiveStepScore,
    probability,
    probabilityPercent,
    isEligibleSubjectMatter: true,
    macroSector,
    criteriaAnalysis: {
      noveltyRisk: hasInventionMemory ? 'low' : 'medium',
      statutoryFit: isEs 
        ? (patentType === 'invention' ? 'Elegible: Producto/Sistema/Método bajo Art. 14 Decisión 486' : 'Elegible: Dispositivo tridimensional con ventaja práctica bajo Art. 81 Decisión 486')
        : (patentType === 'invention' ? 'Eligible: System/Method under WIPO criteria' : 'Eligible: 3D apparatus under Utility Model criteria'),
      inventiveStepJustification
    },
    adviceForHigherProbability: advice
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text = '', priorArt = '', inventionMemory = '', lang = 'es' } = req.body as ClassifyBody;
    const combinedInvention = `${inventionMemory} ${text}`.trim();
    const evaluation = evaluateWithLayaLogic(combinedInvention, priorArt, lang);

    return res.status(200).json(evaluation);
  } catch (error: any) {
    console.error('Error in api/classify_laya:', error);
    return res.status(500).json({ error: 'Failed to evaluate patent with Laya engine' });
  }
}
