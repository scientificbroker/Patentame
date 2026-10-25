function extractDomainAndKeywords(patentData?: PatentData, priorArtDoc?: UploadedFile | null, inventionDescDoc?: UploadedFile | null): { domain: string; descriptor: string } {
  const fullCorpus = [
    patentData?.title || '',
    patentData?.priorArt || '',
    patentData?.technicalSector || '',
    priorArtDoc?.content || '',
    inventionDescDoc?.content || ''
  ].join(' ').toLowerCase();

  if (/dron|drone|uav|aéreo|vuelo|aeronave|fuselaje/i.test(fullCorpus)) {
    return {
      domain: 'drones',
      descriptor: 'vehículos aéreos no tripulados (UAV) y sistemas de sensado multiespectral para agricultura'
    };
  }
  if (/plaga|cultivo|agrícol|agricultura|riego|cosecha|sanidad vegetal/i.test(fullCorpus)) {
    return {
      domain: 'agrotech',
      descriptor: 'tecnologías agronómicas y control automatizado de plagas en cultivos'
    };
  }
  if (/fármaco|biotecnol|proteína|célula|médic|vacuna|anticuerpo/i.test(fullCorpus)) {
    return {
      domain: 'biomed',
      descriptor: 'preparaciones biotecnológicas y sistemas terapéuticos de administración'
    };
  }
  if (/batería|solar|energía|fotovolt|almacenamiento/i.test(fullCorpus)) {
    return {
      domain: 'energy',
      descriptor: 'sistemas de almacenamiento energético y generación fotovoltaica'
    };
  }
  if (/software|algoritmo|ia|inteligencia artificial|red neuronal/i.test(fullCorpus)) {
    return {
      domain: 'software_ai',
      descriptor: 'sistemas computacionales e inteligencia artificial para optimización de datos'
    };
  }

  return {
    domain: 'general',
    descriptor: 'ingeniería y optimización técnica de procesos operativos e industriales'
  };
}

export function getLocalWipoSectionFallback(
  sectionId: string, 
  lang: Language, 
  textToImprove?: string,
  patentData?: PatentData,
  priorArtDoc?: UploadedFile | null,
  inventionDescDoc?: UploadedFile | null
): string {
  const isEs = lang === 'es';
  const baseText = textToImprove ? textToImprove.trim() : '';
  const { domain, descriptor } = extractDomainAndKeywords(patentData, priorArtDoc, inventionDescDoc);

  switch (sectionId) {
    case 'title':
      if (baseText) {
        return isEs
          ? `${baseText.replace(/^[.\s-]+|[.\s-]+$/g, '')} caracterizado por su disposición técnica y ventajas funcionales mejoradas`
          : `${baseText.replace(/^[.\s-]+|[.\s-]+$/g, '')} characterized by its technical arrangement and improved functional advantages`;
      }
      if (domain === 'drones') {
        return isEs
          ? 'Sistema aéreo no tripulado (UAV) con sensado multiespectral y método de control autónomo para inspección agronómica y gestión de plagas'
          : 'Unmanned aerial vehicle (UAV) system with multispectral sensing and autonomous control method for agricultural inspection and pest management';
      }
      return isEs
        ? `Dispositivo y método técnico para ${descriptor} con eficiencia operativa optimizada`
        : `Technical device and method for ${descriptor} with optimized operational efficiency`;

    case 'technicalSector':
    case 'technicalField':
      if (domain === 'drones') {
        return isEs
          ? 'La presente invención se enmarca en el sector técnico de los vehículos aéreos no tripulados (aeronáutica y robótica aérea, CIP B64C / B64U), así como en los sistemas de sensado multiespectral y fotogrametría aplicados a la agricultura de precisión y la sanidad vegetal (CIP A01M, G01N).\n\nEspecíficamente, la invención concierne a la integración funcional de sensores de captura multiespectral en plataformas aéreas autónomas para la detección temprana y localización georreferenciada de afecciones fitosanitarias en cultivos.'
          : 'The present invention relates to the technical field of unmanned aerial vehicles (aeronautics and aerial robotics, IPC B64C / B64U), as well as multispectral sensing systems applied to precision agriculture and plant pathology (IPC A01M, G01N).';
      }
      return isEs
        ? `La presente invención se enmarca en el sector técnico de ${descriptor}, refiriéndose específicamente al desarrollo de sistemas, dispositivos y métodos adaptados para optimizar el rendimiento y superar las limitaciones del estado de la técnica conforme a la Decisión 486 y la OMPI.`
        : `The present invention belongs to the technical field of ${descriptor}, specifically relating to systems and methods configured to optimize efficiency per WIPO guidelines.`;

    case 'priorArt':
      if (baseText) {
        return isEs
          ? `En el estado de la técnica actual y de acuerdo con la vigilancia o antecedentes analizados en torno a ${descriptor}, se registran soluciones que abordan problemáticas afines: ${baseText}. Sin embargo, estas alternativas previas presentan limitaciones operativas, latencia y menor precisión funcional, lo que justifica la necesidad y ventaja inventiva de la presente solicitud.`
          : `In the current state of the art concerning ${descriptor}, known solutions address similar problems: ${baseText}. However, these prior alternatives exhibit operational limitations, justifying the inventive advantage of the present application.`;
      }
      return isEs
        ? `En el estado de la técnica relativo a ${descriptor}, se conocen diversas soluciones que intentan abordar la problemática de monitoreo e intervención operativa. Sin embargo, los sistemas convencionales presentan desventajas críticas en cuanto a precisión, tiempo de respuesta y adaptabilidad en campo, persistiendo una necesidad técnica no satisfecha que la presente invención resuelve de forma eficiente.`
        : `In the current state of the art concerning ${descriptor}, conventional systems exhibit critical limitations in precision, latency, and field adaptability, leaving an unmet technical need efficiently solved by the present invention.`;

    case 'detailedDescription':
      if (domain === 'drones') {
        return isEs
          ? `Descripción Detallada de la Invención:\n\n1. Arquitectura de la Plataforma Aérea:\nEl sistema comprende un fuselaje ligero con tren de propulsión multi-rotor optimizado para vuelos de baja altitud y alta estabilidad contra rachas de viento.\n\n2. Módulo de Carga Útil y Sensado Multiespectral:\nIncorpora una cámara multiespectral estabilizada giroscópicamente en tres ejes, calibrada para capturar bandas espectrales estrechas (infrarrojo cercano y borde rojo) del dosel vegetal.\n\n3. Algoritmo y Procesamiento a Bordo:\nLa unidad de procesamiento embebida sincroniza los fotogramas con datos GNSS centimétricos, computando índices de vegetación normalizados (NDVI) para categorizar vectores de plagas y anomalías fisiológicas en tiempo real.`
          : `Detailed Description:\n1. Aerial Platform Architecture.\n2. Multispectral Payload.\n3. Onboard Edge Processing.`;
      }
      if (baseText) {
        return isEs
          ? `Descripción Detallada de la Invención:\n\n1. Configuración Principal:\n${baseText}\n\n2. Interrelación y Funcionamiento:\nLos componentes descritos interactúan de manera sincronizada para permitir una ejecución continua, estable y eficiente, eliminando los fallos de las técnicas convencionales.\n\n3. Ventajas Operativas:\nLa disposición técnica asegura facilidad de mantenimiento, larga vida útil y adaptabilidad industrial según requerimientos de OMPI.`
          : `Detailed Description of the Invention:\n\n1. Main Configuration:\n${baseText}\n\n2. Operation and Interrelationship:\nThe described components interact synchronously per WIPO requirements.`;
      }
      return isEs
        ? `La invención comprende una disposición técnica integrada para ${descriptor}, combinando órganos de recepción de parámetros y procesamiento activo que operan de manera sinérgica para asegurar viabilidad industrial y alta reproducibilidad.`
        : `The invention comprises an integrated technical arrangement for ${descriptor}, ensuring industrial feasibility.`;

    case 'claims':
      if (domain === 'drones') {
        return isEs
          ? `1. Un sistema aéreo no tripulado para monitoreo agronómico y gestión fitosanitaria, caracterizado por comprender:\n  (a) una plataforma aérea que incluye una estructura de fuselaje, una pluralidad de unidades de propulsión y un controlador de vuelo autónomo;\n  (b) un módulo de sensado multiespectral acoplado a la plataforma aérea y configurado para capturar reflectancia en bandas espectrales seleccionadas de la vegetación; y\n  (c) una unidad de procesamiento de datos comunicada con el módulo de sensado, adaptada para generar mapas georreferenciados de índice de vegetación y detectar vectores de plagas en tiempo real.\n\n2. El sistema según la reivindicación 1, caracterizado porque el módulo de sensado multiespectral incluye un mecanismo de estabilización giroscópica de tres ejes sincronizado dinámicamente con el controlador de vuelo.\n\n3. Un procedimiento para el control fitosanitario mediante el sistema de la reivindicación 1, caracterizado por comprender las etapas de: (i) ejecutar un patrón de vuelo autónomo sobre una superficie agrícola; (ii) adquirir datos multiespectrales sincronizados con coordenadas GNSS; y (iii) clasificar anomalías fisiológicas en el follaje del cultivo mediante discriminación espectral.`
          : `1. An unmanned aerial system for agricultural monitoring, characterized by comprising: an aerial platform, a multispectral sensing module, and a real-time data processing unit.`;
      }
      if (baseText) {
        return isEs
          ? `1. ${baseText.replace(/^[0-9.\s-]+/, '')}\n\n2. El objeto o procedimiento según la reivindicación 1, caracterizado porque adicionalmente incorpora medios de calibración y control operacional adaptados para ${descriptor}.`
          : `1. ${baseText.replace(/^[0-9.\s-]+/, '')}\n\n2. The system according to claim 1, characterized in that it further incorporates calibration means for ${descriptor}.`;
      }
      return isEs
        ? `1. Un sistema o dispositivo para ${descriptor}, caracterizado por comprender una unidad operativa de entrada, un módulo de procesamiento funcional y un mecanismo de adaptación que confiere una ventaja técnica directa frente a las soluciones del arte previo.\n\n2. El sistema según la reivindicación 1, caracterizado porque comprende además elementos de calibración y sincronización en tiempo real.`
        : `1. A system or device for ${descriptor}, characterized by comprising an operational input unit, a functional processing module, and an adaptation mechanism.`;

    case 'abstract':
      if (domain === 'drones') {
        return isEs
          ? 'RESUMEN TÉCNICO:\nLa presente invención divulga un sistema aéreo no tripulado (UAV) y un procedimiento de sensado multiespectral orientado a la agricultura de precisión y la detección temprana de plagas. El sistema integra una plataforma multi-rotor autónoma con una carga útil óptica estabilizada y procesamiento de imágenes a bordo, permitiendo correlacionar índices de vegetación con coordenadas espaciales precisas para optimizar la intervención agronómica y reducir el uso de agroquímicos.'
          : 'TECHNICAL ABSTRACT:\nThe present invention discloses an unmanned aerial system (UAV) and multispectral sensing method for precision agriculture and early pest detection.';
      }
      if (baseText) {
        return isEs
          ? `RESUMEN TÉCNICO:\nLa presente invención divulga: ${baseText}. Su configuración funcional e industrial permite resolver las limitaciones del arte previo, otorgando alta eficiencia y reproducibilidad en torno a ${descriptor}.`
          : `TECHNICAL ABSTRACT:\nThe present invention discloses: ${baseText}. Its configuration overcomes prior art drawbacks.`;
      }
      return isEs
        ? `RESUMEN TÉCNICO:\nLa invención divulga una solución técnica en el campo de ${descriptor}. La configuración sinérgica de sus componentes otorga alta eficiencia, precisión y clara aplicabilidad industrial conforme a las directrices de la OMPI.`
        : `TECHNICAL ABSTRACT:\nThe invention discloses a technical solution in the field of ${descriptor} with clear industrial applicability.`;

    default:
      return isEs
        ? (baseText ? `${baseText}\n\n[Redacción técnica estructurada sobre ${descriptor} conforme a las directrices OMPI / Decisión 486].` : `Sección técnica estructurada sobre ${descriptor} conforme a las directrices de patentabilidad OMPI y la Decisión 486.`)
        : (baseText ? `${baseText}\n\n[Technical drafting structured per WIPO guidelines].` : `Technical section structured per WIPO guidelines.`);
  }
}
