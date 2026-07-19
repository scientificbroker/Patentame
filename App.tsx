

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PatentData, PatentSectionKey, PatentType, Language, UploadedFile } from './types';
import { SectionInput } from './components/SectionInput';
import { improveText, isAiAvailable, generateDraft, classifyPatentType, PatentClassification, generateSearchQuery } from './src/services/gemini';
import { searchPatents, PatentResult } from './src/services/api';
import { SparklesIcon, DownloadIcon, UploadIcon, PencilIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FileTextIcon, GithubIcon, InfoIcon } from './components/icons';
import { STRINGS, getSectionDetails } from './data/i18n';
import customLogo from './assets/logot.png';
import { FtoChatbot } from './components/FtoChatbot';
import { OnboardingTour } from './components/OnboardingTour';
import { DonationModal } from './components/DonationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Heart } from 'lucide-react';


// New Components
const LanguageSwitcher = ({ lang, setLang }: { lang: Language; setLang: (lang: Language) => void; }) => (
    <div className="flex items-center space-x-2 rounded-full p-1 bg-white/10 backdrop-blur-md">
        <button onClick={() => setLang('es')} className={`px-3 py-1 text-sm rounded-full transition-colors ${lang === 'es' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/20'}`}>ES</button>
        <button onClick={() => setLang('en')} className={`px-3 py-1 text-sm rounded-full transition-colors ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/20'}`}>EN</button>
    </div>
);

const ImprovementPanel = ({ originalText, improvedText, onApply, onDiscard, lang }: { originalText: string, improvedText: string, onApply: (text: string) => void, onDiscard: () => void, lang: Language }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-4xl bg-[#1c164a] border border-white/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold mb-4 text-white">{STRINGS[lang].improvementPanel.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh]">
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">{STRINGS[lang].improvementPanel.original}</h4>
                    <textarea readOnly value={originalText} className="w-full h-full p-3 bg-white/5 rounded-lg border border-white/10 text-gray-300 resize-none" />
                </div>
                <div>
                    <h4 className="font-semibold text-purple-400 mb-2">{STRINGS[lang].improvementPanel.suggestion}</h4>
                    <textarea readOnly value={improvedText} className="w-full h-full p-3 bg-purple-900/20 rounded-lg border border-purple-500/50 text-white resize-none" />
                </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
                <button onClick={onDiscard} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">{STRINGS[lang].improvementPanel.discard}</button>
                <button onClick={() => onApply(improvedText)} className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">{STRINGS[lang].improvementPanel.apply}</button>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    // App State
    const [step, setStep] = useState(0);
    const [lang, setLang] = useState<Language>('es');
    const [patentType, setPatentType] = useState<PatentType | null>(null);
    const [patentData, setPatentData] = useState<PatentData>({
        title: '', technicalSector: '', priorArt: '', inventionSummary: '', detailedDescription: '', claims: '', abstract: ''
    });
    const [priorArtDoc, setPriorArtDoc] = useState<UploadedFile | null>(null);
    const [inventionDescDoc, setInventionDescDoc] = useState<UploadedFile | null>(null);
    
    // AI Interaction State
    const [improvingSection, setImprovingSection] = useState<PatentSectionKey | null>(null);
    const [improvementData, setImprovementData] = useState<{ original: string, improved: string, section: PatentSectionKey } | null>(null);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    // Surveillance State
    const [surveillanceMode, setSurveillanceMode] = useState<'upload' | 'assistant'>('assistant');
    const [ideaDescription, setIdeaDescription] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<PatentResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedPatents, setSelectedPatents] = useState<Set<string>>(new Set());

    // Classification State
    const [classification, setClassification] = useState<PatentClassification | null>(null);
    const [isClassifying, setIsClassifying] = useState(false);
    const [showManualSelect, setShowManualSelect] = useState(false);

    // Onboarding State
    const [runOnboarding, setRunOnboarding] = useState(false);
    
    // Donation State
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeen) {
            setRunOnboarding(true);
        }
    }, []);

    const handleFinishOnboarding = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setRunOnboarding(false);
    };

    const SECTIONS = useMemo(() => getSectionDetails(lang), [lang]);
    const WIZARD_STEPS = useMemo(() => [
        { name: STRINGS[lang].steps.welcome, isComplete: true },
        { name: STRINGS[lang].steps.upload, isComplete: (priorArtDoc !== null || inventionDescDoc !== null) && patentType !== null },
        ...SECTIONS.map(s => ({ name: s.title, isComplete: s.id === 'detailedDescription' ? true : patentData[s.id].trim().length > 5 })),
        { name: STRINGS[lang].steps.checklist, isComplete: true },
    ], [lang, patentType, priorArtDoc, inventionDescDoc, patentData, SECTIONS]);


    const currentSectionIndex = step - 2;
    const currentSection = (currentSectionIndex >= 0 && currentSectionIndex < SECTIONS.length) ? SECTIONS[currentSectionIndex] : null;

    useEffect(() => {
        const fetchPrediction = async () => {
            if (currentSection && !patentData[currentSection.id] && patentType && isAiAvailable()) {
                setIsPredicting(true);
                setPrediction(null);
                try {
                    const draft = await generateDraft(currentSection, patentType, lang, patentData, priorArtDoc, inventionDescDoc);
                    // Check if user hasn't started typing in the meantime
                    if (!patentData[currentSection.id]) {
                        setPrediction(draft);
                    }
                } finally {
                    setIsPredicting(false);
                }
            }
        };

        fetchPrediction();
    }, [step, lang, patentType, priorArtDoc, inventionDescDoc, patentData]); // Rerun when step or context changes

    // Handlers
    const handleValueChange = (section: PatentSectionKey) => (value: string) => {
        // Any typing clears the prediction
        if (prediction) {
            setPrediction(null);
        }
        setPatentData(prev => ({ ...prev, [section]: value }));
    };
    
    const handleAcceptPrediction = () => {
        if (prediction && currentSection) {
            setPatentData(prev => ({ ...prev, [currentSection.id]: prediction }));
            setPrediction(null);
        }
    };

    const handleFileChange = (setter: React.Dispatch<React.SetStateAction<UploadedFile | null>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 3.5 * 1024 * 1024) {
                alert(lang === 'es' ? 'El archivo es demasiado grande. Por favor sube un documento de menos de 3.5 MB.' : 'File is too large. Please upload a document smaller than 3.5 MB.');
                return;
            }
            const reader = new FileReader();
            if (file.type === 'application/pdf') {
                reader.onload = (e) => setter({ name: file.name, content: (e.target?.result as string).split(',')[1], mimeType: file.type });
                reader.readAsDataURL(file);
            } else if (file.type === 'text/plain') {
                reader.onload = (e) => setter({ name: file.name, content: e.target?.result as string, mimeType: file.type });
                reader.readAsText(file);
            } else {
                alert('Unsupported file type. Please upload a .txt or .pdf file.');
            }
            // Reset classification when new file is uploaded
            setClassification(null);
            setShowManualSelect(false);
        }
    };

    const handleClassify = async () => {
        if (!priorArtDoc && !inventionDescDoc) return;
        setIsClassifying(true);
        setClassification(null);
        try {
            const result = await classifyPatentType(priorArtDoc, inventionDescDoc, lang);
            setClassification(result);
            // Auto-apply the recommendation
            setPatentType(result.recommendation);
        } catch (error) {
            console.error('Classification failed', error);
        } finally {
            setIsClassifying(false);
        }
    };

    const handleSearchPatents = async () => {
        if (!ideaDescription.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setHasSearched(false);
        try {
            const query = await generateSearchQuery(ideaDescription, lang);
            const results = await searchPatents(query);
            setSearchResults(results);
            setHasSearched(true);
        } catch (error: any) {
            console.error('Patent search failed:', error);
            setSearchError(error?.message || (lang === 'es' ? 'Fallo en la búsqueda de patentes. Intenta de nuevo.' : 'Patent search failed. Try again.'));
            setHasSearched(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFtoSearch = async (query: string) => {
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setHasSearched(false);
        setStep(1);
        setSurveillanceMode('assistant');
        setIdeaDescription(query); // Put the query in the box so they know what was searched
        try {
            const results = await searchPatents(query);
            setSearchResults(results);
            setHasSearched(true);
        } catch (error: any) {
            console.error('FTO Search failed:', error);
            setSearchError(error?.message || (lang === 'es' ? 'Fallo en la búsqueda de patentes. Intenta de nuevo.' : 'Patent search failed. Try again.'));
            setHasSearched(true);
        } finally {
            setIsSearching(false);
        }
    };

    const togglePatentSelection = (id: string) => {
        setSelectedPatents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const generatePriorArtDoc = () => {
        if (selectedPatents.size === 0) return;
        
        const selectedDocs = searchResults.filter(p => selectedPatents.has(p.id));
        let content = "DOCUMENTO AUTO-GENERADO: ESTADO DE LA TÉCNICA (VIGILANCIA TECNOLÓGICA)\n\n";
        
        selectedDocs.forEach((doc, idx) => {
            content += `--- PATENTE ${idx + 1} ---\n`;
            content += `TÍTULO: ${doc.title}\n`;
            content += `ID/FUENTE: ${doc.id} (${doc.source})\n`;
            content += `INVENTOR/ASIGNATARIO: ${doc.inventor} / ${doc.assignee}\n`;
            content += `RESUMEN:\n${doc.abstract}\n\n`;
        });

        setPriorArtDoc({
            name: 'vigilancia_tecnologica.txt',
            content: content,
            mimeType: 'text/plain'
        });
        
        // Auto-switch to upload view to continue the flow
        setSurveillanceMode('upload');
    };
    
    const handleImprove = async (section: typeof SECTIONS[0]) => {
        const textToImprove = patentData[section.id];
        if (!textToImprove || !patentType) return;
        setImprovingSection(section.id);
        try {
            const improvedText = await improveText(textToImprove, section, patentData, patentType, lang, priorArtDoc, inventionDescDoc);
            if(improvedText.startsWith('Error:')) {
                alert(improvedText);
                return;
            }
            setImprovementData({ original: textToImprove, improved: improvedText, section: section.id });
        } catch (error) {
            console.error("Improvement failed", error);
            alert(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setImprovingSection(null);
        }
    };

    const handleApplyImprovement = (text: string) => {
        if (improvementData) {
            handleValueChange(improvementData.section)(text);
        }
        setImprovementData(null);
    };

    const handleDownloadPdf = () => {
        const sections = getSectionDetails(lang);
        const title = patentData.title || "Untitled Patent Application";
        const disclaimer = STRINGS[lang].welcome.disclaimer;

        let htmlContent = `
            <html>
                <head>
                    <title>Patent Application: ${title}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; padding: 2rem; color: #111; }
                        h1 { font-size: 26px; color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 24px; }
                        h2 { font-size: 20px; color: #222; margin-top: 32px; margin-bottom: 12px; }
                        p { white-space: pre-wrap; word-wrap: break-word; text-align: justify; }
                        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #888; text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
        `;

        sections.forEach(section => {
            const sectionContent = patentData[section.id];
            // Only include sections that have content or are not optional
            if (sectionContent || section.id !== 'detailedDescription') {
                 htmlContent += `
                    <h2>${section.title}</h2>
                    <p>${sectionContent || 'Not provided.'}</p>
                `;
            }
        });

        htmlContent += `
                    <div class="footer">
                        <p>${disclaimer}</p>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            // Give browser time to render before prompting print
             setTimeout(() => {
                printWindow.print();
             }, 500);
        } else {
            alert(STRINGS[lang].checklist.popupBlocker);
        }
    };
    
    const handleNext = () => setStep(s => {
        const nextStep = Math.min(s + 1, WIZARD_STEPS.length - 1);
        // Clear prediction when moving to next step
        if (prediction) setPrediction(null);
        if (isPredicting) setIsPredicting(false);
        return nextStep;
    });
    const handlePrev = () => setStep(s => {
        const prevStep = Math.max(s - 1, 0);
        // Clear prediction when moving to prev step
        if (prediction) setPrediction(null);
        if (isPredicting) setIsPredicting(false);
        return prevStep;
    });

    // Render Logic
    const renderStepContent = () => {
        switch (step) {
            case 0: // Welcome
                return (
                    <div className="text-center flex flex-col items-center">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-300">
                            <SparklesIcon className="w-4 h-4 mr-2 text-purple-400" />
                            {lang === 'es' ? 'Una innovación del Grupo Biogenia' : 'An innovation by Grupo Biogenia'}
                        </div>
                        <h2 className="text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                            {STRINGS[lang].welcome.title}
                        </h2>
                        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                            {lang === 'es' 
                             ? 'Simplifica y acelera la redacción de tus solicitudes de patente. Nuestra IA especializada te guiará paso a paso, analizando tu arte previo y estructurando tus ideas bajo los estándares internacionales de la OMPI.'
                             : 'Simplify and accelerate the drafting of your patent applications. Our specialized AI will guide you step-by-step, analyzing your prior art and structuring your ideas under international WIPO standards.'
                            }
                        </p>
                        
                         <div className="max-w-3xl mx-auto text-xs text-gray-500 border-t border-white/10 pt-6">
                            <p>{STRINGS[lang].welcome.disclaimer}</p>
                        </div>
                    </div>
                );
            case 1: // Upload
                const FileInput = ({ id, label, file, onChange }: {id: string, label: string, file: UploadedFile | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => (
                    <div>
                        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                        <div className={`flex items-center p-3 rounded-lg border-2 border-dashed ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/20'}`}>
                            {file ? <CheckIcon className="w-6 h-6 text-green-400 mr-3 shrink-0" /> : <FileTextIcon className="w-6 h-6 text-gray-400 mr-3 shrink-0" />}
                            <div className="flex-grow">
                                <span className={`block truncate ${file ? 'text-white' : 'text-gray-400'}`}>{file ? file.name : STRINGS[lang].upload.noFile}</span>
                                <input id={id} type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={onChange} className="absolute w-0 h-0 opacity-0" />
                                <button onClick={() => document.getElementById(id)?.click()} className="text-sm text-purple-400 hover:underline">{STRINGS[lang].upload.selectFile}</button>
                            </div>
                        </div>
                    </div>
                );
                const hasDocuments = priorArtDoc !== null || inventionDescDoc !== null;
                const confidenceColor = {
                    high: 'text-green-400 bg-green-500/10 border-green-500/30',
                    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                    low: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
                };
                const confidenceLabel = {
                    es: { high: 'Alta', medium: 'Media', low: 'Baja' },
                    en: { high: 'High', medium: 'Medium', low: 'Low' },
                };

                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{STRINGS[lang].upload.title}</h2>
                        <p className="text-gray-400 mb-6">{STRINGS[lang].upload.subtitle}</p>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 mb-6">
                            <button
                                onClick={() => setSurveillanceMode('assistant')}
                                className={`tour-surveillance-tab px-4 py-3 text-sm font-medium transition-all border-b-2 ${surveillanceMode === 'assistant' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20'}`}
                            >
                                🔍 {lang === 'es' ? 'Asistente de Vigilancia Tecnológica' : 'Technical Surveillance Assistant'}
                            </button>
                            <button
                                onClick={() => setSurveillanceMode('upload')}
                                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${surveillanceMode === 'upload' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20'}`}
                            >
                                📁 {lang === 'es' ? 'Subir mis documentos' : 'Upload my documents'}
                            </button>
                        </div>

                        {surveillanceMode === 'assistant' ? (
                            <div className="space-y-6">
                                <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-xl">
                                    <h3 className="font-semibold text-purple-300 mb-2">
                                        {lang === 'es' ? '¿No tienes documento de Arte Previo?' : "Don't have a Prior Art document?"}
                                    </h3>
                                    <p className="text-sm text-gray-300 mb-4">
                                        {lang === 'es' 
                                         ? 'Describe tu invención. Nuestra IA creará una ecuación de búsqueda, consultará la base de datos global de patentes (EPO) y armará tu documento de Estado de la Técnica automáticamente.'
                                         : 'Describe your invention. Our AI will create a search query, consult the global patent database (EPO), and build your State of the Art document automatically.'}
                                    </p>
                                    
                                    <textarea
                                        value={ideaDescription}
                                        onChange={(e) => setIdeaDescription(e.target.value)}
                                        placeholder={lang === 'es' ? 'Ej. Mi invención es un dron híbrido que usa paneles solares y purifica agua...' : 'E.g. My invention is a hybrid drone using solar panels...'}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none resize-y min-h-[120px] mb-4"
                                    />
                                    
                                    {searchError && (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm flex items-start gap-2">
                                            <InfoIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold">{lang === 'es' ? 'Error al buscar patentes' : 'Error searching patents'}</p>
                                                <p className="text-xs opacity-90 mt-0.5">{searchError}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSearchPatents}
                                        disabled={isSearching || ideaDescription.trim().length < 10}
                                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex justify-center items-center gap-2 transition-all"
                                    >
                                        {isSearching ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                {lang === 'es' ? 'Consultando patentes mundiales...' : 'Querying global patents...'}
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                {lang === 'es' ? 'Buscar Patentes Similares' : 'Search Similar Patents'}
                                            </>
                                        )}
                                    </button>
                                </div>

                                {hasSearched && searchResults.length === 0 && !isSearching && !searchError && (
                                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
                                        <div className="text-lg">⚠️</div>
                                        <div>
                                            <p className="font-semibold mb-1">
                                                {lang === 'es' ? 'No se encontraron patentes directas para esta consulta.' : 'No direct patents found for this query.'}
                                            </p>
                                            <p className="text-xs opacity-90 leading-relaxed">
                                                {lang === 'es' 
                                                    ? 'Hemos intentado varias combinaciones técnicas, pero la base de datos no arrojó coincidencias exactas. Intenta simplificar la descripción (enfócate en solo 2 palabras clave principales) o continúa al siguiente paso para redactar tu solicitud.'
                                                    : 'We tried multiple technical queries, but no exact hits returned. Try simplifying your description or proceed directly to drafting your application.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="font-bold text-white mb-4">
                                            {lang === 'es' ? 'Patentes Encontradas' : 'Found Patents'}
                                        </h3>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                            {searchResults.map((patent) => (
                                                <div 
                                                    key={patent.id}
                                                    onClick={() => togglePatentSelection(patent.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPatents.has(patent.id) ? 'border-green-500 bg-green-900/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedPatents.has(patent.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                            {selectedPatents.has(patent.id) && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <div>
                                                            <a href={patent.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="font-semibold text-blue-300 hover:underline text-sm block mb-1">
                                                                {patent.title}
                                                            </a>
                                                            <div className="flex gap-2 text-xs text-gray-500 mb-2">
                                                                <span>{patent.id}</span>
                                                                <span>•</span>
                                                                <span>{patent.assignee}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                                                {patent.abstract}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button
                                            onClick={generatePriorArtDoc}
                                            disabled={selectedPatents.size === 0}
                                            className="w-full mt-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium flex justify-center items-center gap-2"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                            {lang === 'es' 
                                                ? `Generar Arte Previo con (${selectedPatents.size}) Patentes` 
                                                : `Generate Prior Art with (${selectedPatents.size}) Patents`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl mb-6">
                                   <div className="flex items-start">
                                     <InfoIcon className="w-5 h-5 text-blue-400 mr-3 shrink-0 mt-0.5" />
                                     <div>
                                       <h4 className="text-sm font-semibold text-blue-300 mb-1">{lang === 'es' ? 'Límite de tamaño' : 'Size limit'}</h4>
                                       <p className="text-sm text-blue-200/80">
                                         {lang === 'es' 
                                          ? 'Para garantizar un procesamiento rápido y evitar errores de red, por favor asegúrate de que cada documento pese menos de 3.5 MB. Si tu archivo es más pesado, considera subir solo las páginas más relevantes.'
                                          : 'To ensure fast processing and avoid network errors, please make sure each document is under 3.5 MB. If your file is larger, consider uploading only the relevant pages.'}
                                       </p>
                                     </div>
                                   </div>
                                </div>

                                <div className="space-y-6 mb-8">
                                    <FileInput id="prior-art-file" label={STRINGS[lang].upload.priorArt} file={priorArtDoc} onChange={handleFileChange(setPriorArtDoc)} />
                                    <FileInput id="invention-desc-file" label={STRINGS[lang].upload.inventionDesc} file={inventionDescDoc} onChange={handleFileChange(setInventionDescDoc)} />
                                </div>

                                {/* AI Classification Panel */}
                                {hasDocuments && !classification && !isClassifying && (
                                    <button
                                        onClick={handleClassify}
                                        className="w-full py-3 px-6 rounded-xl border-2 border-dashed border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/40 hover:border-purple-400 transition-all duration-300 flex items-center justify-center gap-3 text-purple-300 font-medium group"
                                    >
                                        <SparklesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        {lang === 'es' ? '✨ Analizar documentos con IA para recomendar tipo de patente' : '✨ Analyze documents with AI to recommend patent type'}
                                    </button>
                                )}

                                {isClassifying && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin"></div>
                                        <p className="text-purple-300 text-sm animate-pulse">
                                            {lang === 'es' ? 'Analizando documentos con IA... (~10 segundos)' : 'Analyzing documents with AI... (~10 seconds)'}
                                        </p>
                                    </div>
                                )}

                                {classification && !isClassifying && (
                                    <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-white/10">
                                            <SparklesIcon className="w-5 h-5 text-purple-400" />
                                            <h3 className="font-bold text-white">
                                                {lang === 'es' ? 'Recomendación de la IA' : 'AI Recommendation'}
                                            </h3>
                                            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${confidenceColor[classification.confidence]}`}>
                                                {lang === 'es' ? 'Confianza: ' : 'Confidence: '}{confidenceLabel[lang][classification.confidence]}
                                            </span>
                                        </div>

                                        {/* Recommendation badge */}
                                        <div className="px-5 pt-5 pb-3">
                                            {/* Missing Invention Description Scrutiny Notice */}
                                            {!inventionDescDoc && (
                                                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                                                    <span className="text-xl shrink-0">⚠️</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-1">
                                                            {lang === 'es' ? 'Escrutinio Parcial (Falta Memoria Técnica del Invento)' : 'Partial Scrutiny (Missing Invention Memory)'}
                                                        </p>
                                                        <p className="text-xs text-amber-200/90 leading-relaxed">
                                                            {lang === 'es'
                                                                ? 'Has subido únicamente tus antecedentes técnicos (vigilancia). Para someter TU propuesta al escrutinio formal de Novedad Mundial y No Obviedad, es necesario cargar el archivo "Descripción de la invención / Memoria técnica". Esta recomendación infiere la categoría legal en función de la materia y complejidad tecnológica del campo según los antecedentes cargados.'
                                                                : 'You uploaded only technical background (surveillance). To subject YOUR proposal to formal scrutiny of World Novelty and Non-Obviousness, please upload the "Invention Description / Technical Memory" file. This suggestion infers the category based on the subject matter and technical complexity of the uploaded prior art.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg mb-4 ${
                                                classification.recommendation === 'invention'
                                                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
                                                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-200'
                                            }`}>
                                                {classification.recommendation === 'invention'
                                                    ? (lang === 'es' ? '🔬 Patente de Invención' : '🔬 Invention Patent')
                                                    : (lang === 'es' ? '🔧 Modelo de Utilidad' : '🔧 Utility Model')}
                                            </div>

                                            {/* Reasoning */}
                                            <p className="text-gray-300 text-sm leading-relaxed mb-4">{classification.reasoning}</p>

                                            {/* Criteria Breakdown Matrix */}
                                            {classification.criteriaBreakdown && classification.criteriaBreakdown.length > 0 && (
                                                <div className="mb-5 p-4 bg-black/40 border border-white/10 rounded-2xl">
                                                    <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <span>📋</span> {lang === 'es' ? 'Matriz de Criterios Legales OMPI / INDECOPI' : 'WIPO / INDECOPI Legal Criteria Matrix'}
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-2.5">
                                                        {classification.criteriaBreakdown.map((item, idx) => (
                                                            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                                                                item.status === 'pass' ? 'bg-green-500/10 border-green-500/30 text-green-200' :
                                                                item.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
                                                                'bg-blue-500/10 border-blue-500/30 text-blue-200'
                                                            }`}>
                                                                <span className="text-sm shrink-0">
                                                                    {item.status === 'pass' ? '✅' : item.status === 'warning' ? '⚠️' : 'ℹ️'}
                                                                </span>
                                                                <div>
                                                                    <p className="font-bold mb-0.5">{item.name}</p>
                                                                    <p className="text-gray-300/90 leading-relaxed">{item.explanation}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strategic Advice */}
                                            {classification.strategicAdvice && (
                                                <div className="mb-5 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl flex items-start gap-3">
                                                    <span className="text-lg shrink-0">💡</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-1">
                                                            {lang === 'es' ? 'Consejo Estratégico de Cobertura' : 'Strategic Filing Advice'}
                                                        </p>
                                                        <p className="text-xs text-purple-100/90 leading-relaxed">{classification.strategicAdvice}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Signals */}
                                            {classification.signals.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                        {lang === 'es' ? 'Señales detectadas en los documentos:' : 'Signals detected in documents:'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {classification.signals.map((signal, i) => (
                                                            <span key={i} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">📌 {signal}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Risks */}
                                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 mb-5">
                                                <p className="text-xs text-yellow-300/80">⚠️ {classification.risks}</p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() => { setPatentType(classification.recommendation); setShowManualSelect(false); }}
                                                    className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                                                        patentType === classification.recommendation
                                                            ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                                            : 'bg-purple-600/70 hover:bg-purple-600 text-white'
                                                    }`}
                                                >
                                                    {patentType === classification.recommendation
                                                        ? (lang === 'es' ? '✓ Recomendación aplicada' : '✓ Recommendation applied')
                                                        : (lang === 'es' ? 'Aceptar recomendación' : 'Accept recommendation')}
                                                </button>
                                                <button
                                                    onClick={() => setShowManualSelect(s => !s)}
                                                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border border-white/20 text-gray-300 hover:bg-white/5 transition-all"
                                                >
                                                    {lang === 'es' ? 'Elegir manualmente' : 'Choose manually'}
                                                </button>
                                            </div>

                                            {showManualSelect && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                                                    <button onClick={() => setPatentType('invention')} className={`p-4 rounded-xl border-2 text-left transition-all ${ patentType === 'invention' ? 'border-purple-500 bg-purple-900/30' : 'border-white/10 bg-white/5 hover:border-purple-500/50'}` }>
                                                        <p className="font-bold text-white text-sm">🔬 {lang === 'es' ? 'Patente de Invención' : 'Invention Patent'}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{lang === 'es' ? 'Paso inventivo alto, 20 años' : 'High inventive step, 20 years'}</p>
                                                    </button>
                                                    <button onClick={() => setPatentType('utilityModel')} className={`p-4 rounded-xl border-2 text-left transition-all ${ patentType === 'utilityModel' ? 'border-blue-500 bg-blue-900/30' : 'border-white/10 bg-white/5 hover:border-blue-500/50'}` }>
                                                        <p className="font-bold text-white text-sm">🔧 {lang === 'es' ? 'Modelo de Utilidad' : 'Utility Model'}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{lang === 'es' ? 'Mejora práctica, 10 años' : 'Practical improvement, 10 years'}</p>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case SECTIONS.length + 2: // Checklist
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{STRINGS[lang].checklist.title}</h2>
                        <p className="text-gray-400 mb-6">{STRINGS[lang].checklist.subtitle}</p>
                        <ul className="space-y-3">
                            {STRINGS[lang].checklist.items.map((item: string, index: number) => (
                                <li key={index} className="flex items-start p-3 bg-white/5 rounded-lg border border-white/10">
                                    <CheckIcon className="w-5 h-5 text-green-400 mr-4 mt-1 shrink-0" />
                                    <span className="text-gray-200">{item}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="mt-6 p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg text-sm text-purple-200/90 flex items-start">
                            <InfoIcon className="h-5 w-5 mr-3 text-purple-400 shrink-0 mt-0.5" />
                            <p>{STRINGS[lang].checklist.wipoTip}</p>
                        </div>

                         <div className="mt-8 text-center text-gray-400 border-t border-white/10 pt-6">
                            <a href="https://github.com/scientificbroker" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-purple-400 hover:underline">
                                <GithubIcon className="w-5 h-5 mr-2" />
                                <span>{STRINGS[lang].checklist.openSourceCredit.line1}</span>
                            </a>
                        </div>
                    </div>
                );
            default:
                if (currentSection) {
                    return (
                        <SectionInput
                            key={currentSection.id}
                            id={currentSection.id}
                            title={currentSection.title}
                            helpText={currentSection.helpText}
                            placeholder={currentSection.placeholder}
                            wipoRecommendation={currentSection.wipoRecommendation}
                            value={patentData[currentSection.id]}
                            onValueChange={handleValueChange(currentSection.id)}
                            onImprove={() => handleImprove(currentSection)}
                            improveButtonText={STRINGS[lang].improveButton}
                            isImproving={improvingSection === currentSection.id}
                            prediction={prediction}
                            isPredicting={isPredicting}
                            onAcceptPrediction={handleAcceptPrediction}
                            generatingDraftText={STRINGS[lang].generatingDraft}
                        />
                    );
                }
                return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 relative">
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
                <button onClick={() => setRunOnboarding(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-sm" title={lang === 'es' ? 'Ver Tutorial' : 'View Tutorial'}>
                    <InfoIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === 'es' ? 'Tutorial' : 'Tour'}</span>
                </button>
            </div>
            
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-3 z-50">
                <button 
                  onClick={() => setIsDonationModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm border border-white/10 group"
                >
                  <Heart className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform fill-purple-400/20" />
                  <span className="text-sm font-medium text-slate-200 hidden md:inline">
                    {lang === 'es' ? 'Contribuye con un' : 'Contribute with a'}
                  </span>
                  <div className="flex items-center gap-1.5 ml-1">
                    <div className="w-6 h-6 bg-[#74008B] rounded flex items-center justify-center text-white font-bold italic text-[9px] leading-none tracking-tighter shadow-sm">yape</div>
                    <div className="w-6 h-6 bg-[#003087] rounded flex items-center justify-center text-white font-bold italic text-[12px] leading-none shadow-sm">P</div>
                  </div>
                </button>
                <LanguageSwitcher lang={lang} setLang={setLang} />
            </div>

            <div className="w-full max-w-7xl mx-auto pt-14 sm:pt-10 md:pt-4">
                 <header className="mb-8">
                     <div className="flex flex-col items-center justify-center mb-6 select-none">
                         <div className="relative flex items-center justify-center transform transition-transform hover:scale-105 duration-300 w-full max-w-xs sm:max-w-sm md:max-w-lg">
                             <img src={customLogo} alt="Patentame Logo" className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-xl" />
                         </div>
                     </div>
                      { !isAiAvailable() && (
                        <div className="max-w-3xl mx-auto bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm p-3 rounded-lg text-center" role="alert">
                            {STRINGS[lang].aiWarning}
                        </div>
                    )}
                </header>
                
                {/* Wizard Progress Bar */}
                 <div className="tour-wizard-bar w-full overflow-x-auto pb-4 mb-8">
                    <div className="flex items-start justify-between min-w-[800px]">
                        {WIZARD_STEPS.map((s, index) => (
                             <div className="flex-1 flex items-start" key={`${s.name}-${index}`}>
                                <div className="flex flex-col items-center w-20 text-center">
                                    <div className={`tour-wizard-step-${index} w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${
                                        step > index ? 'bg-purple-600 border-purple-600' :
                                        step === index ? 'bg-purple-500 border-purple-500 ring-4 ring-purple-500/30' :
                                        'bg-gray-700 border-gray-600'
                                    }`}>
                                        {step > index ? <CheckIcon className="w-5 h-5 text-white" /> : <span className="font-bold text-white">{index + 1}</span>}
                                    </div>
                                    <p className={`mt-2 text-xs font-medium transition-colors break-words ${
                                        step >= index ? 'text-white' : 'text-gray-400'
                                    }`}>{s.name}</p>
                                </div>
                                {index < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-0.5 mt-5 transition-colors ${step > index ? 'bg-purple-600' : 'bg-gray-700'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <main className="w-full max-w-4xl mx-auto p-6 sm:p-10 bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl min-h-[400px] flex flex-col justify-center">
                    <ErrorBoundary key={step} onReset={() => setStep(0)}>
                        {renderStepContent()}
                    </ErrorBoundary>
                </main>
                
                 {improvementData && (
                    <ImprovementPanel 
                        originalText={improvementData.original}
                        improvedText={improvementData.improved}
                        onApply={handleApplyImprovement}
                        onDiscard={() => setImprovementData(null)}
                        lang={lang}
                    />
                )}

                {/* Navigation */}
                <footer className="w-full max-w-4xl mx-auto mt-8 flex justify-between items-center">
                    <button onClick={handlePrev} disabled={step === 0} className="flex items-center px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        {STRINGS[lang].nav.prev}
                    </button>
                    <button 
                        onClick={step === WIZARD_STEPS.length - 1 ? handleDownloadPdf : handleNext} 
                        disabled={!WIZARD_STEPS[step]?.isComplete}
                        className="tour-next-button flex items-center px-6 py-2 bg-gradient-to-r from-[#A100A0] to-[#6b21a8] text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-[#b100b0] hover:to-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        {step === WIZARD_STEPS.length - 1 ? (
                            <>
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                {STRINGS[lang].checklist.downloadButton}
                            </>
                        ) : (
                             <>
                                {STRINGS[lang].nav.next}
                                <ChevronRightIcon className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </footer>
            </div>
            
            <FtoChatbot onSearchRequest={handleFtoSearch} />
            
            <OnboardingTour run={runOnboarding} onFinish={handleFinishOnboarding} lang={lang} />
            
            <DonationModal 
              isOpen={isDonationModalOpen} 
              onClose={() => setIsDonationModalOpen(false)} 
              lang={lang} 
            />
        </div>
    );
};

// FIX: Add default export for the App component
export default App;