import { Language, SectionDetail, PatentSectionKey } from '../types';

interface StringLib {
    [key: string]: any;
}

const STRINGS_DATA: StringLib = {
    en: {
        aiWarning: "AI Service Unavailable: The API_KEY is not configured. AI features are disabled.",
        improveButton: "Improve with AI",
        generatingDraft: "Generating draft",
        steps: {
            welcome: "Welcome",
            upload: "Upload Docs",
            checklist: "Checklist",
        },
        welcome: {
            title: "Welcome to Patentame",
            subtitle: "Let's start drafting your patent application. First, select the type of protection you are seeking.",
            invention: "Invention Patent",
            inventionDesc: "For new products or processes that represent a significant inventive step.",
            utilityModel: "Utility Model",
            utilityModelDesc: "For improvements to existing tools or devices, offering a practical advantage.",
            disclaimer: "This is a DEMO whose use implies your consent for the temporary and indicative processing of the documents or data you provide. The files you upload are only used to suggest improvements and help you with the drafting, and will not be stored. Terms of Use: this demo is for educational/guidance purposes only, does not constitute legal advice, nor does it guarantee patent rights."
        },
        upload: {
            title: "Upload Source Documents",
            subtitle: "Provide your existing technical documents (PDF or TXT). The text content will be used to give the AI context for better suggestions.",
            priorArt: "State of the Art / Antecedents (.txt, .pdf)",
            inventionDesc: "Invention Description / Technical Memo (.txt, .pdf)",
            noFile: "No file selected",
            selectFile: "Click to select a file"
        },
        checklist: {
            title: "Final Checklist",
            subtitle: "Review your draft against WIPO recommendations before downloading.",
            items: [
                "Is the title short, precise, and descriptive of the invention?",
                "Does the abstract provide a clear and concise summary (50-150 words)?",
                "Does the 'Prior Art' section clearly explain the existing problem?",
                "Does the 'Patent Background' section list relevant prior patents?",
                "Is the 'Detailed Description' sufficient for an expert to reproduce the invention?",
                "Are the claims clear, and is claim 1 the broadest?",
                "Is the language consistent, and are all terms used unambiguously?",
            ],
            wipoTip: "WIPO Tip: Before finishing, check that each section is complete and coherent. Use our automatic and manual checklist.",
            downloadInstructions: "When you're ready, download your application as a PDF document.",
            downloadButton: "Download PDF",
            popupBlocker: "Your browser may have blocked the print pop-up. Please allow pop-ups for this site.",
            openSourceCredit: {
                line1: "Developed by @scientificbroker, an Open Source project."
            }
        },
        nav: {
            prev: "Previous",
            next: "Next",
            finish: "Finish"
        },
        improvementPanel: {
            title: "AI Improvement Suggestions",
            original: "Your Text",
            suggestion: "AI Suggestion",
            apply: "Apply Changes",
            discard: "Discard"
        },
        sections: [
            { id: 'title', title: 'Title of Invention', helpText: 'A concise and descriptive title. Should be clear and accurately reflect the invention.', placeholder: 'e.g., A method for automating patent drafting...', wipoRecommendation: 'WIPO Recommendation: Use a clear and specific title. Avoid trademarks and vague words. Summarize the technical essence in a single sentence.' },
            { id: 'technicalSector', title: 'Technical Sector', helpText: 'Specify the technical field to which the invention belongs.', placeholder: 'e.g., The invention relates to software development tools...', wipoRecommendation: 'WIPO Recommendation: Mention the technological area where the invention applies. Example: “It belongs to the medical devices sector”.' },
            { id: 'priorArt', title: 'Prior Art (State of the Art)', helpText: 'Describe the existing technology and its limitations. Explain the problem that the invention solves.', placeholder: 'e.g., Current methods for patent drafting are manual and time-consuming...', wipoRecommendation: 'WIPO Recommendation: List related technologies, patents, or publications. Be impartial and briefly explain what the invention contributes in comparison.' },
            { id: 'inventionSummary', title: 'Patent Background (IPC/EPO Codes)', helpText: 'List relevant prior art patents and their international classification codes (e.g., IPC or EPO). This demonstrates an understanding of the existing patent landscape.', placeholder: 'e.g., US Patent 12345 B2 (IPC: G06F 16/00) describes a system for data retrieval...\nEP Patent 67890 A1 (EPO: H04L 29/06) discloses a method for secure communication...', wipoRecommendation: 'WIPO Recommendation: If you know the international classification code (IPC), include it. This helps the examiner locate the area. Example: A61B for surgical instruments.' },
            { id: 'detailedDescription', title: 'Detailed Description (Optional)', helpText: 'Describe the best way to carry out the invention. This section should be detailed enough for an expert to reproduce it.', placeholder: 'e.g., The system comprises a user interface for uploading documents, a backend server with an AI model...', wipoRecommendation: 'WIPO Recommendation: Explain how the invention works and is manufactured. Detail materials, processes, measurements, and possible variations until an expert can replicate it.' },
            { id: 'claims', title: 'Claims', helpText: 'Define the scope of legal protection. Start with the broadest claim and follow with more specific dependent claims.', placeholder: 'e.g., 1. A method for drafting a patent, comprising the steps of: ...', wipoRecommendation: 'WIPO Recommendation: Formulate the claims starting with the key technical feature (“A device characterized by…”). Be clear, precise, and avoid including features not previously described.' },
            { id: 'abstract', title: 'Abstract', helpText: 'A concise summary of the invention (typically 50-150 words) that allows readers to quickly understand the gist of the technical disclosure.', placeholder: 'e.g., An AI-powered method and system for automating the generation of patent applications...', wipoRecommendation: 'WIPO Recommendation: The abstract should be between 50-150 words, be objective, and explain the technical function and use, without giving opinions or repeating the title.' },
        ]
    },
    es: {
        aiWarning: "Servicio de IA no disponible: La API_KEY no está configurada. Las funciones de IA están deshabilitadas.",
        improveButton: "Mejorar con IA",
        generatingDraft: "Generando borrador",
        steps: {
            welcome: "Bienvenida",
            upload: "Cargar Docs",
            checklist: "Lista de Verificación",
        },
        welcome: {
            title: "Bienvenido a Patentame",
            subtitle: "Comencemos a redactar tu solicitud de patente. Primero, selecciona el tipo de protección que buscas.",
            invention: "Patente de Invención",
            inventionDesc: "Para productos o procesos nuevos que representan un paso inventivo significativo.",
            utilityModel: "Modelo de Utilidad",
            utilityModelDesc: "Para mejoras a herramientas o dispositivos existentes, ofreciendo una ventaja práctica.",
            disclaimer: "Esta es una DEMO cuyo uso implica tu consentimiento para el procesamiento temporal y orientativo de los documentos o datos que entregues. Los archivos que subas sólo se utilizan para sugerir mejoras y ayudarte en la redacción, y no serán almacenados. Términos de uso: esta demo es exclusivamente con fines educativos/orientativos, no constituye asesoría legal ni garantiza derechos de patente."
        },
        upload: {
            title: "Cargar Documentos Fuente",
            subtitle: "Proporciona tus documentos técnicos existentes (PDF o TXT). El contenido de texto se usará para darle contexto a la IA para mejores sugerencias.",
            priorArt: "Estado de la técnica / Antecedentes (.txt, .pdf)",
            inventionDesc: "Descripción de la invención / Memoria técnica (.txt, .pdf)",
            noFile: "Ningún archivo seleccionado",
            selectFile: "Haz clic para seleccionar un archivo"
        },
        checklist: {
            title: "Lista de Verificación Final",
            subtitle: "Revisa tu borrador con las recomendaciones de la OMPI antes de descargar.",
            items: [
                "¿Es el título corto, preciso y descriptivo de la invención?",
                "¿El resumen proporciona una síntesis clara y concisa (50-150 palabras)?",
                "¿La sección de 'Estado de la Técnica' explica claramente el problema existente?",
                "¿La sección de 'Antecedente de Patentes' enumera patentes previas relevantes?",
                "¿Es la 'Descripción Detallada' suficiente para que un experto reproduzca la invención?",
                "¿Son las reivindicaciones claras, y es la reivindicación 1 la más amplia?",
                "¿Es el lenguaje consistente y se usan todos los términos sin ambigüedad?",
            ],
            wipoTip: "Consejo WIPO: Antes de terminar, revisa que cada sección está completa y es coherente. Usa nuestro checklist automático y manual.",
            downloadInstructions: "Cuando estés listo, descarga tu solicitud como un documento PDF.",
            downloadButton: "Descargar PDF",
            popupBlocker: "Tu navegador puede haber bloqueado la ventana emergente de impresión. Por favor, habilita las ventanas emergentes para este sitio.",
             openSourceCredit: {
                line1: "Desarrollado por @scientificbroker, un proyecto Open Source."
            }
        },
        nav: {
            prev: "Anterior",
            next: "Siguiente",
            finish: "Finalizar"
        },
        improvementPanel: {
            title: "Sugerencias de Mejora de la IA",
            original: "Tu Texto",
            suggestion: "Sugerencia de la IA",
            apply: "Aplicar Cambios",
            discard: "Descartar"
        },
        sections: [
            { id: 'title', title: 'Título de la Invención', helpText: 'Un título conciso y descriptivo. Debe ser claro y reflejar con precisión la invención.', placeholder: 'Ej: Un método para la redacción automatizada de patentes...', wipoRecommendation: 'Recomendación WIPO: Usa un título claro y específico. Evita marcas comerciales y palabras vagas. Resume la esencia técnica en una sola frase.' },
            { id: 'technicalSector', title: 'Sector Técnico', helpText: 'Especifica el campo técnico al que pertenece la invención.', placeholder: 'Ej: La invención se relaciona con herramientas de desarrollo de software...', wipoRecommendation: 'Recomendación WIPO: Menciona el área tecnológica donde aplica la invención. Ejemplo: “Pertenece al sector de dispositivos médicos”.' },
            { id: 'priorArt', title: 'Estado de la Técnica (Arte Previo)', helpText: 'Describe la tecnología existente y sus limitaciones. Explica el problema que la invención resuelve.', placeholder: 'Ej: Los métodos actuales para la redacción de patentes son manuales y requieren mucho tiempo...', wipoRecommendation: 'Recomendación WIPO: Enumera las tecnologías, patentes o publicaciones que se relacionan. Sé imparcial y explica brevemente qué aporta el invento en comparación.' },
            { id: 'inventionSummary', title: 'Antecedente de Patentes (Códigos CIP/EPO)', helpText: 'Enumera las patentes de arte previo relevantes y sus códigos de clasificación internacional (p. ej., CIP o EPO). Esto demuestra un entendimiento del panorama de patentes existente.', placeholder: 'Ej: La patente US 12345 B2 (CIP: G06F 16/00) describe un sistema para la recuperación de datos...\nLa patente EP 67890 A1 (EPO: H04L 29/06) divulga un método para la comunicación segura...', wipoRecommendation: 'Recomendación WIPO: Si sabes el código de clasificación internacional (CIP/IPC), inclúyelo. Esto ayuda a que el examinador ubique el área. Ejemplo: A61B para instrumentos quirúrgicos.' },
            { id: 'detailedDescription', title: 'Descripción Detallada (Opcional)', helpText: 'Describe la mejor manera de llevar a cabo la invención. Esta sección debe ser lo suficientemente detallada para que un experto pueda reproducirla.', placeholder: 'Ej: El sistema comprende una interfaz de usuario para cargar documentos, un servidor backend con un modelo de IA...', wipoRecommendation: 'Recomendación WIPO: Explica cómo funciona y se fabrica la invención. Detalla materiales, procesos, medidas y variantes posibles, hasta que un experto lo pueda replicar.' },
            { id: 'claims', title: 'Reivindicaciones', helpText: 'Define el alcance de la protección legal. Comienza con la reivindicación más amplia y sigue con reivindicaciones dependientes más específicas.', placeholder: 'Ej: 1. Un método para redactar una patente, que comprende los pasos de: ...', wipoRecommendation: 'Recomendación WIPO: Formula las reivindicaciones empezando por la característica técnica clave (“Un dispositivo caracterizado por…”). Sé claro, preciso y evita incluir características no descritas antes.' },
            { id: 'abstract', title: 'Resumen', helpText: 'Un resumen conciso de la invención (típicamente 50-150 palabras) que permite a los lectores comprender rápidamente la esencia de la divulgación técnica.', placeholder: 'Ej: Un método y sistema impulsado por IA para automatizar la generación de solicitudes de patente...', wipoRecommendation: 'Recomendación WIPO: El resumen debe tener entre 50-150 palabras, ser objetivo y explicar la función y uso técnico, sin dar opiniones ni repetir el título.' },
        ]
    }
};

export const STRINGS = STRINGS_DATA;

export const getSectionDetails = (lang: Language): SectionDetail[] => {
    return STRINGS[lang].sections.map((s: any) => ({
        id: s.id as PatentSectionKey,
        title: s.title,
        helpText: s.helpText,
        placeholder: s.placeholder,
        wipoRecommendation: s.wipoRecommendation,
    }));
};