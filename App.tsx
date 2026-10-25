

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PatentData, PatentSectionKey, PatentType, Language, UploadedFile } from './types';
import { SectionInput } from './components/SectionInput';
import { improveText, isAiAvailable, generateDraft, generateInventionMemoryDraft, classifyPatentType, PatentClassification, generateSearchQuery } from './src/services/gemini';
import { searchPatents, searchPatentsDetailed, PatentResult } from './src/services/api';
import { SparklesIcon, DownloadIcon, UploadIcon, PencilIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FileTextIcon, GithubIcon, InfoIcon } from './components/icons';
import { STRINGS, getSectionDetails } from './data/i18n';
import customLogo from './assets/logot.png';
import { FtoChatbot } from './components/FtoChatbot';
import { OnboardingTour } from './components/OnboardingTour';
import { DonationModal } from './components/DonationModal';
import { ConnectLawyerModal } from './components/ConnectLawyerModal';
import { Scale, RotateCcw, Trash2 } from 'lucide-react';
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
    const [searchActiveTab, setSearchActiveTab] = useState<'all' | 'patent' | 'thesis' | 'article'>('all');
    const [searchEquation, setSearchEquation] = useState<string | null>(null);

    // Classification State
    const [classification, setClassification] = useState<PatentClassification | null>(null);
    const [isClassifying, setIsClassifying] = useState(false);
    const [showManualSelect, setShowManualSelect] = useState(false);

    // AI Technical Memory Assistant State
    const [showAiMemoryHelper, setShowAiMemoryHelper] = useState(false);
    const [aiMemoryProblem, setAiMemoryProblem] = useState('');
    const [aiMemorySolution, setAiMemorySolution] = useState('');
    const [aiMemoryAdvantage, setAiMemoryAdvantage] = useState('');
    const [isGeneratingMemory, setIsGeneratingMemory] = useState(false);

    // Onboarding State
    const [runOnboarding, setRunOnboarding] = useState(false);
    
    // Donation State
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
    const [savedDraftFound, setSavedDraftFound] = useState<{ date: string; title: string } | null>(null);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeen) {
            setRunOnboarding(true);
        }

        // Detección de borrador previo en localStorage
        try {
            const rawDraft = localStorage.getItem('patentame_draft_state_v1');
            if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                const hasAnyContent = parsed.patentData && Object.values(parsed.patentData).some((v: any) => typeof v === 'string' && v.trim().length > 10);
                if (hasAnyContent) {
                    const formattedDate = new Date(parsed.timestamp || Date.now()).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    setSavedDraftFound({
                        date: formattedDate,
                        title: parsed.patentData.title || (lang === 'es' ? 'Invención en curso' : 'Ongoing invention')
                    });
                }
            }
        } catch (e) {
            console.warn('Error reading saved draft from localStorage:', e);
        }
    }, []);

    // Autosave con Debounce (800ms) en localStorage
    useEffect(() => {
        const hasAnyContent = Object.values(patentData).some(v => v.trim().length > 0) || ideaDescription.trim().length > 0;
        if (!hasAnyContent) return;

        const timer = setTimeout(() => {
            try {
                const draftToSave = {
                    version: 1,
                    timestamp: Date.now(),
                    step,
                    patentType,
                    patentData,
                    ideaDescription,
                    classification
                };
                localStorage.setItem('patentame_draft_state_v1', JSON.stringify(draftToSave));
            } catch (err) {
                console.warn('LocalStorage autosave failed:', err);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [step, patentType, patentData, ideaDescription, classification]);

    const handleRestoreDraft = () => {
        try {
            const raw = localStorage.getItem('patentame_draft_state_v1');
            if (!raw) return;
            const draft = JSON.parse(raw);
            if (draft.patentData) setPatentData(draft.patentData);
            if (draft.patentType) setPatentType(draft.patentType);
            if (typeof draft.step === 'number') setStep(draft.step);
            if (draft.ideaDescription) setIdeaDescription(draft.ideaDescription);
            if (draft.classification) setClassification(draft.classification);
            setSavedDraftFound(null);
        } catch (err) {
            console.error('Failed to restore draft', err);
        }
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('patentame_draft_state_v1');
        setSavedDraftFound(null);
    };

    const handleResetAll = () => {
        if (window.confirm(lang === 'es' ? '¿Deseas iniciar una nueva solicitud y vaciar este borrador?' : 'Start a new draft and clear current work?')) {
            localStorage.removeItem('patentame_draft_state_v1');
            setPatentData({ title: '', technicalSector: '', priorArt: '', inventionSummary: '', detailedDescription: '', claims: '', abstract: '' });
            setPriorArtDoc(null);
            setInventionDescDoc(null);
            setClassification(null);
            setStep(0);
        }
    };

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

    const handleGenerateAiMemory = async () => {
        if (!aiMemoryProblem || !aiMemorySolution || !aiMemoryAdvantage) return;
        setIsGeneratingMemory(true);
        try {
            const generatedContent = await generateInventionMemoryDraft(
                aiMemoryProblem,
                aiMemorySolution,
                aiMemoryAdvantage,
                lang
            );
            if (generatedContent) {
                setInventionDescDoc({
                    name: lang === 'es' ? 'memoria_tecnica_ia.txt' : 'ai_technical_memory.txt',
                    content: generatedContent,
                    size: generatedContent.length
                });
                setShowAiMemoryHelper(false);
                setAiMemoryProblem('');
                setAiMemorySolution('');
                setAiMemoryAdvantage('');
            }
        } catch (error) {
            console.error('Failed to generate AI technical memory', error);
        } finally {
            setIsGeneratingMemory(false);
        }
    };

    const handleSearchPatents = async () => {
        if (!ideaDescription.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        setSearchEquation(null);
        setSearchActiveTab('all');
        setHasSearched(false);
        try {
            const data = await searchPatentsDetailed(ideaDescription);
            setSearchResults(data.results);
            setSearchEquation(data.searchEquation || null);
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
        setSearchEquation(null);
        setSearchActiveTab('all');
        setHasSearched(false);
        setStep(1);
        setSurveillanceMode('assistant');
        setIdeaDescription(query);
        try {
            const data = await searchPatentsDetailed(query);
            setSearchResults(data.results);
            setSearchEquation(data.searchEquation || null);
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
            const typeLabel = doc.documentTypeLabel || 'DOCUMENTO TÉCNICO';
            content += `--- [${idx + 1}] ${typeLabel.toUpperCase()} ---\n`;
            content += `TÍTULO: ${doc.title}\n`;
            content += `ID/FUENTE: ${doc.id} (${doc.source})\n`;
            if (doc.cipCode) content += `CLASIFICACIÓN CIP: [${doc.cipCode}] ${doc.cipDescription || ''}\n`;
            content += `INVENTOR/AUTOR/ASIGNATARIO: ${doc.inventor} / ${doc.assignee}\n`;
            if (doc.link) content += `ENLACE OFICIAL: ${doc.link}\n`;
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
        if (!patentType) return;
        setImprovingSection(section.id);
        try {
            let improvedText = '';
            if (!textToImprove || textToImprove.trim() === '') {
                improvedText = await generateDraft(section, patentType, lang, patentData, priorArtDoc, inventionDescDoc);
            } else {
                improvedText = await improveText(textToImprove, section, patentData, patentType, lang, priorArtDoc, inventionDescDoc);
            }
            if (improvedText && improvedText.startsWith('Error:')) {
                alert(improvedText);
                return;
            }
            if (!textToImprove || textToImprove.trim() === '') {
                handleValueChange(section.id)(improvedText);
            } else {
                setImprovementData({ original: textToImprove, improved: improvedText, section: section.id });
            }
        } catch (error) {
            console.error("Improvement failed", error);
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
        let counter = 1;

        let htmlContent = `
            <html>
                <head>
                    <title>Borrador de Patente: ${title}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; padding: 2.5rem; color: #111; max-width: 850px; margin: 0 auto; }
                        .header-box { border: 2px solid #333; padding: 18px; margin-bottom: 28px; background-color: #f8fafc; border-radius: 6px; }
                        .header-title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #0f172a; letter-spacing: 0.5px; }
                        .header-meta { font-size: 13px; color: #475569; margin-bottom: 4px; }
                        h1 { font-size: 24px; color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px; font-weight: 800; }
                        h2 { font-size: 16px; color: #1e293b; margin-top: 28px; margin-bottom: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                        p { margin-bottom: 14px; text-align: justify; word-wrap: break-word; }
                        .para-num { font-weight: 700; color: #64748b; margin-right: 8px; font-family: monospace; }
                        .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 10px; color: #64748b; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header-box">
                        <div class="header-title">EXPEDIENTE TÉCNICO BORRADOR (ESTÁNDAR OMPI / DECISIÓN 486)</div>
                        <div class="header-meta"><b>Modalidad de Protección Solicitada:</b> ${patentType === 'invention' ? 'Patente de Invención (20 años)' : 'Modelo de Utilidad (10 años)'}</div>
                        <div class="header-meta"><b>Aviso Legal:</b> Documento orientativo redactado para estructuración técnica e inspección de novedad. No constituye documento oficial ni formulario legal de Indecopi u otras oficinas.</div>
                    </div>
                    <h1>${title}</h1>
        `;

        sections.forEach(section => {
            const sectionContent = (patentData[section.id] || '').trim();
            if (sectionContent || section.id !== 'detailedDescription') {
                 htmlContent += `<h2>${section.title}</h2>`;
                 if (section.id === 'claims' || section.id === 'title' || section.id === 'abstract') {
                     const lines = sectionContent ? sectionContent.split(/\n+/) : ['Not provided.'];
                     lines.forEach(line => {
                         if (line.trim()) htmlContent += `<p>${line.trim()}</p>`;
                     });
                 } else {
                     const lines = sectionContent ? sectionContent.split(/\n+/) : ['Not provided.'];
                     lines.forEach(line => {
                         if (line.trim()) {
                             const numStr = String(counter++).padStart(4, '0');
                             htmlContent += `<p><span class="para-num">[${numStr}]</span> ${line.trim()}</p>`;
                         }
                     });
                 }
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
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } else {
            alert(STRINGS[lang].checklist.popupBlocker);
        }
    };

    const handleDownloadDoc = () => {
        const sections = getSectionDetails(lang);
        const title = patentData.title || "Untitled Patent Application";
        const disclaimer = STRINGS[lang].welcome.disclaimer;
        let counter = 1;

        let docHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #111; padding: 20px; }
                        .header-box { border: 2px solid #444; padding: 15px; margin-bottom: 25px; background-color: #f9f9f9; }
                        .header-title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; color: #111; }
                        .header-meta { font-size: 13px; color: #444; margin-bottom: 4px; }
                        h1 { font-size: 22px; color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; font-weight: bold; }
                        h2 { font-size: 16px; color: #222; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
                        p { margin-bottom: 14px; text-align: justify; }
                        .para-num { font-weight: bold; color: #555; margin-right: 8px; font-family: monospace; }
                        .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #aaa; font-size: 10px; color: #666; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header-box">
                        <div class="header-title">EXPEDIENTE TÉCNICO BORRADOR (ESTÁNDAR OMPI / DECISIÓN 486)</div>
                        <div class="header-meta"><b>Modalidad de Protección Solicitada:</b> ${patentType === 'invention' ? 'Patente de Invención (20 años)' : 'Modelo de Utilidad (10 años)'}</div>
                        <div class="header-meta"><b>Aviso Legal:</b> Documento orientativo redactado para estructuración técnica e inspección de novedad. No constituye documento oficial ni formulario legal de Indecopi u otras oficinas.</div>
                    </div>
                    <h1>${title}</h1>
        `;

        sections.forEach(section => {
            const sectionContent = (patentData[section.id] || '').trim();
            if (sectionContent || section.id !== 'detailedDescription') {
                 docHtml += `<h2>${section.title}</h2>`;
                 if (section.id === 'claims' || section.id === 'title' || section.id === 'abstract') {
                     const lines = sectionContent ? sectionContent.split(/\n+/) : ['Not provided.'];
                     lines.forEach(line => {
                         if (line.trim()) docHtml += `<p>${line.trim()}</p>`;
                     });
                 } else {
                     const lines = sectionContent ? sectionContent.split(/\n+/) : ['Not provided.'];
                     lines.forEach(line => {
                         if (line.trim()) {
                             const numStr = String(counter++).padStart(4, '0');
                             docHtml += `<p><span class="para-num">[${numStr}]</span> ${line.trim()}</p>`;
                         }
                     });
                 }
            }
        });

        docHtml += `
                    <div class="footer">
                        <p>${disclaimer}</p>
                    </div>
                </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'solicitud'}_borrador_ompi.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                                         ? 'Describe tu invención. Nuestra IA creará la ecuación técnica y consultará simultáneamente bases globales de patentes (EPO, USPTO), tesis académicas (OpenAlex) y literatura científica para blindar tu Estado del Arte.'
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
                                                {lang === 'es' ? 'Consultando patentes, tesis y literatura global...' : 'Querying global patents, theses & papers...'}
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                {lang === 'es' ? 'Buscar Patentes, Tesis y Literatura Previa' : 'Search Patents, Theses & Prior Literature'}
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
                                    <div className="mt-8 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <h3 className="font-bold text-white text-base">
                                                {lang === 'es' ? 'Documentos de Estado de la Técnica Encontrados' : 'Prior Art Documents Found'}
                                            </h3>
                                            <span className="text-xs text-purple-300 font-semibold bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full w-fit">
                                                {searchResults.length} {lang === 'es' ? 'referencias recuperadas' : 'references found'}
                                            </span>
                                        </div>

                                        {/* Ecuación Booleana de Búsqueda FTO */}
                                        {searchEquation && (
                                            <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/30 text-xs text-purple-200 flex flex-col sm:flex-row items-start sm:items-center gap-2 shadow-inner">
                                                <span className="font-bold text-purple-400 shrink-0 flex items-center gap-1.5">
                                                    <span>🔍</span>
                                                    <span>{lang === 'es' ? 'Ecuación FTO Generada:' : 'Generated FTO Equation:'}</span>
                                                </span>
                                                <code className="font-mono text-[11px] text-purple-200 bg-purple-900/30 px-2 py-0.5 rounded break-all select-all flex-1">
                                                    {searchEquation}
                                                </code>
                                            </div>
                                        )}

                                        {/* Tabs de Categorización */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/10 pb-3">
                                            <button
                                                type="button"
                                                onClick={() => setSearchActiveTab('all')}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                    searchActiveTab === 'all'
                                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                }`}
                                            >
                                                {lang === 'es' ? 'Todos' : 'All'} ({searchResults.length})
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSearchActiveTab('patent')}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    searchActiveTab === 'patent'
                                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                                        : 'bg-purple-950/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40'
                                                }`}
                                            >
                                                <span>🔬</span>
                                                <span>{lang === 'es' ? 'Patentes' : 'Patents'}</span>
                                                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px]">
                                                    {searchResults.filter(r => r.documentType === 'patent').length}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSearchActiveTab('thesis')}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    searchActiveTab === 'thesis'
                                                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                                                        : 'bg-amber-950/30 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
                                                }`}
                                            >
                                                <span>🎓</span>
                                                <span>{lang === 'es' ? 'Tesis Académicas' : 'Theses'}</span>
                                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px]">
                                                    {searchResults.filter(r => r.documentType === 'thesis').length}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSearchActiveTab('article')}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    searchActiveTab === 'article'
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                        : 'bg-blue-950/30 border border-blue-500/30 text-blue-300 hover:bg-blue-900/40'
                                                }`}
                                            >
                                                <span>📄</span>
                                                <span>{lang === 'es' ? 'Papers Científicos' : 'Papers'}</span>
                                                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-[10px]">
                                                    {searchResults.filter(r => r.documentType === 'article').length}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Lista de Resultados Filtrados por Tab */}
                                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                            {searchResults
                                                .filter(item => searchActiveTab === 'all' || item.documentType === searchActiveTab)
                                                .map((patent) => (
                                                <div 
                                                    key={patent.id}
                                                    onClick={() => togglePatentSelection(patent.id)}
                                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPatents.has(patent.id) ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-900/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${selectedPatents.has(patent.id) ? 'bg-green-500 border-green-500' : 'border-gray-500 bg-black/40'}`}>
                                                            {selectedPatents.has(patent.id) && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            {/* Document Type Badge & Year */}
                                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                                    patent.documentType === 'patent' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                                                                    patent.documentType === 'article' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                                                                    patent.documentType === 'thesis' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                                                                    'bg-gray-500/20 border-gray-500/40 text-gray-300'
                                                                }`}>
                                                                    {patent.documentTypeLabel || '🔬 Patente / Documento Técnico'}
                                                                </span>
                                                                {patent.year && patent.year !== 'N/A' && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                                                        📅 {patent.year}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Title */}
                                                            <a href={patent.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="font-semibold text-blue-300 hover:text-blue-200 hover:underline text-sm block mb-1.5 leading-snug">
                                                                {patent.title}
                                                            </a>

                                                            {/* ID & Assignee */}
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-2 font-medium">
                                                                <span className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded text-[11px]">{patent.id}</span>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[320px] text-gray-300">{patent.assignee}</span>
                                                            </div>

                                                            {/* CIP (Clasificación Internacional de Patentes) Badge */}
                                                            {patent.cipCode && (
                                                                <div className="mb-2 p-2 rounded-xl bg-black/40 border border-purple-500/30 flex items-start gap-2 text-xs">
                                                                    <span className="text-purple-400 font-bold shrink-0 mt-0.5">🏷️ CIP [{patent.cipCode}]:</span>
                                                                    <span className="text-purple-200/90 text-[11px] leading-tight">{patent.cipDescription || 'Clasificación Internacional de Patentes'}</span>
                                                                </div>
                                                            )}

                                                            {/* Abstract */}
                                                            <p className="text-xs text-gray-300/90 line-clamp-3 leading-relaxed">
                                                                {patent.abstract}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={generatePriorArtDoc}
                                            disabled={selectedPatents.size === 0}
                                            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex justify-center items-center gap-2 shadow-xl shadow-green-900/30 transition-all transform hover:scale-[1.01]"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                            {lang === 'es' 
                                                ? `Generar Arte Previo con (${selectedPatents.size}) ${selectedPatents.size === 1 ? 'Documento Seleccionado' : 'Documentos Seleccionados'}`
                                                : `Generate Prior Art with (${selectedPatents.size}) Selected ${selectedPatents.size === 1 ? 'Document' : 'Documents'}`}
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
                                    <div>
                                        <FileInput id="invention-desc-file" label={STRINGS[lang].upload.inventionDesc} file={inventionDescDoc} onChange={handleFileChange(setInventionDescDoc)} />
                                        {!inventionDescDoc && (
                                            <div className="mt-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAiMemoryHelper(s => !s)}
                                                    className="text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-2 transition-colors py-2 px-3 rounded-xl bg-purple-900/30 border border-purple-500/30 w-full justify-center shadow-sm hover:border-purple-500/60"
                                                >
                                                    <SparklesIcon className="w-4 h-4 text-purple-400 shrink-0" />
                                                    {lang === 'es'
                                                        ? '✨ ¿Aún no tienes archivo de Memoria Técnica? Redáctala con IA aquí en 3 breves pasos para obtener Certeza 100%'
                                                        : '✨ No Invention Description file? Draft it here with AI in 3 steps for 100% Certainty'}
                                                </button>

                                                {showAiMemoryHelper && (
                                                    <div className="mt-3 p-5 bg-black/80 border border-purple-500/40 rounded-2xl space-y-4 animate-fadeIn shadow-2xl">
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                                                                <span>🤖</span> {lang === 'es' ? 'Asistente IA de Redacción para Escrutinio' : 'AI Drafting Assistant for Scrutiny'}
                                                            </h4>
                                                            <button onClick={() => setShowAiMemoryHelper(false)} className="text-gray-400 hover:text-white text-sm font-bold">✕</button>
                                                        </div>
                                                        <p className="text-xs text-gray-300 leading-relaxed">
                                                            {lang === 'es'
                                                                ? 'Responde brevemente estas 3 preguntas clave y la IA estructurará formalmente tu Memoria Técnica para adjuntarla y someter tu invento al escrutinio exacto de Novedad Mundial y No Obviedad.'
                                                                : 'Briefly answer these 3 key questions and AI will formally structure your Technical Memory to attach it and subject your invention to exact scrutiny of World Novelty and Non-Obviousness.'}
                                                        </p>
                                                        <div className="space-y-3.5 text-left">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                                                                    1. {lang === 'es' ? '¿Qué problema técnico concreto resuelve tu propuesta?' : 'What specific technical problem does your proposal solve?'}
                                                                </label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={aiMemoryProblem}
                                                                    onChange={e => setAiMemoryProblem(e.target.value)}
                                                                    placeholder={lang === 'es' ? 'Ej: La muerte repentina y falta de monitoreo en tiempo real de temperatura o sonido en colmenas remotas...' : 'Ex: Lack of real-time acoustic and temperature monitoring in remote beehives...'}
                                                                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                                                                    2. {lang === 'es' ? '¿En qué consiste tu solución y cómo funciona paso a paso?' : 'What is your solution and how does it work step by step?'}
                                                                </label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={aiMemorySolution}
                                                                    onChange={e => setAiMemorySolution(e.target.value)}
                                                                    placeholder={lang === 'es' ? 'Ej: Sistema que integra sensores acústicos piezoeléctricos e IoT procesando frecuencias en la nube para detectar anomalías...' : 'Ex: System with piezoelectric acoustic sensors and IoT that analyzes frequencies in the cloud...'}
                                                                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                                                                    3. {lang === 'es' ? '¿Qué ventaja o diferencia inventiva tiene frente a lo que ya existe?' : 'What inventive difference/advantage does it have over prior art?'}
                                                                </label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={aiMemoryAdvantage}
                                                                    onChange={e => setAiMemoryAdvantage(e.target.value)}
                                                                    placeholder={lang === 'es' ? 'Ej: Clasifica el estado de la colmena mediante IA sin necesidad de abrir la caja ni alterar el microclima de las abejas...' : 'Ex: Classifies hive status via AI without opening the box or disturbing bees...'}
                                                                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleGenerateAiMemory}
                                                                disabled={!aiMemoryProblem.trim() || !aiMemorySolution.trim() || !aiMemoryAdvantage.trim() || isGeneratingMemory}
                                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex justify-center items-center gap-2 shadow-lg transition-all"
                                                            >
                                                                {isGeneratingMemory ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        {lang === 'es' ? 'Sintetizando y adjuntando Memoria Técnica...' : 'Synthesizing and attaching Technical Memory...'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <SparklesIcon className="w-4 h-4" />
                                                                        {lang === 'es' ? '✨ Generar y Adjuntar Memoria Técnica al Escrutinio' : '✨ Generate & Attach Technical Memory for Scrutiny'}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
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

                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${
                                                    classification.recommendation === 'invention'
                                                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
                                                        : 'bg-blue-500/20 border border-blue-500/40 text-blue-200'
                                                }`}>
                                                    {classification.recommendation === 'invention'
                                                        ? (lang === 'es'
                                                            ? (!inventionDescDoc || classification.confidence !== 'high' ? '🔬 Potencial Patente de Invención' : '🔬 Patente de Invención')
                                                            : (!inventionDescDoc || classification.confidence !== 'high' ? '🔬 Potential Invention Patent' : '🔬 Invention Patent'))
                                                        : (lang === 'es'
                                                            ? (!inventionDescDoc || classification.confidence !== 'high' ? '🔧 Potencial Modelo de Utilidad' : '🔧 Modelo de Utilidad')
                                                            : (!inventionDescDoc || classification.confidence !== 'high' ? '🔧 Potential Utility Model' : '🔧 Utility Model'))}
                                                </div>

                                                {/* Badge Probabilidad Laya Engine */}
                                                {classification.probabilityPercent && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                                                        <span>⚡ Probabilidad Laya:</span>
                                                        <span className="text-emerald-200 font-extrabold text-sm">{classification.probabilityPercent}%</span>
                                                    </div>
                                                )}

                                                {/* Badge Nivel Inventivo (1 a 10) */}
                                                {classification.inventiveStepScore && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-sm">
                                                        <span>🎯 Altura Inventiva:</span>
                                                        <span className="text-purple-100 font-extrabold text-sm">{classification.inventiveStepScore}/10</span>
                                                    </div>
                                                )}
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
                                                <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl flex items-start gap-3">
                                                    <span className="text-lg shrink-0">💡</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-1">
                                                            {lang === 'es' ? 'Consejo Estratégico de Cobertura' : 'Strategic Filing Advice'}
                                                        </p>
                                                        <p className="text-xs text-purple-100/90 leading-relaxed">{classification.strategicAdvice}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Laya Engine - Consejo para maximizar probabilidad */}
                                            {classification.adviceForHigherProbability && (
                                                <div className="mb-5 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                                                    <span className="text-lg shrink-0">🚀</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide mb-1">
                                                            {lang === 'es' ? 'Recomendación Laya para Elevar Probabilidad' : 'Laya Guidance for Higher Allowance Probability'}
                                                        </p>
                                                        <p className="text-xs text-emerald-100/90 leading-relaxed">{classification.adviceForHigherProbability}</p>
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
                        <ul className="space-y-3 mb-8">
                            {STRINGS[lang].checklist.items.map((item: string, index: number) => (
                                <li key={index} className="flex items-start p-3 bg-white/5 rounded-lg border border-white/10">
                                    <CheckIcon className="w-5 h-5 text-green-400 mr-4 mt-1 shrink-0" />
                                    <span className="text-gray-200">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-xl border border-purple-400/30 transition-all transform hover:scale-105"
                            >
                                <DownloadIcon className="w-6 h-6 mr-3 shrink-0" />
                                <div className="text-left">
                                    <div className="text-base font-extrabold">{lang === 'es' ? 'Descargar Expediente PDF' : 'Download PDF Draft'}</div>
                                    <div className="text-xs text-purple-200 font-normal">{lang === 'es' ? 'Con párrafos numerados [0001] e insignias OMPI' : 'With numbered paragraphs [0001] & WIPO format'}</div>
                                </div>
                            </button>
                            <button
                                onClick={handleDownloadDoc}
                                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-xl border border-blue-400/30 transition-all transform hover:scale-105"
                            >
                                <FileTextIcon className="w-6 h-6 mr-3 shrink-0" />
                                <div className="text-left">
                                    <div className="text-base font-extrabold">{lang === 'es' ? 'Exportar a Word (.DOC)' : 'Export to Word (.DOC)'}</div>
                                    <div className="text-xs text-blue-200 font-normal">{lang === 'es' ? 'Editable para presentación final ante abogados/oficina' : 'Editable format for legal & office filing'}</div>
                                </div>
                            </button>
                        </div>

                         {/* TARJETA DE CONVERSIÓN COMERCIAL: CONECTAR CON ABOGADO */}
                         <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden text-left">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-3.5 bg-purple-600/30 border border-purple-400/50 rounded-2xl text-purple-300 shrink-0 shadow-lg">
                                        <Scale className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                            <span>⚖️ {lang === 'es' ? 'Asesoría y Trámite Legal de Patentes' : 'Official Patent Advisory & Filing'}</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-white">
                                            {lang === 'es' ? '¿Listo para patentar? Conecta con un Agente Oficial de Patentes' : 'Ready to patent? Connect with an Official Patent Attorney'}
                                        </h3>
                                        <p className="text-xs text-purple-200/90 mt-1 max-w-xl leading-relaxed">
                                            {lang === 'es'
                                                ? 'Un abogado colegiado especialista en propiedad intelectual revisará la suficiencia técnica y blindará las reivindicaciones para presentar tu solicitud ante la oficina oficial (INDECOPI, OEPM, USPTO, SIC o vía PCT).'
                                                : 'A specialized patent attorney will audit technical sufficiency and file your application before your target intellectual property office.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsLawyerModalOpen(true)}
                                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl transition-all transform hover:scale-105 shrink-0 flex items-center justify-center gap-2"
                                >
                                    <span>{lang === 'es' ? 'Solicitar Revisión con Especialista' : 'Request Specialist Review'}</span>
                                    <span>→</span>
                                </button>
                            </div>
                         </div>

                         <div className="mt-6 p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg text-sm text-purple-200/90 flex items-start">
                            <InfoIcon className="h-5 w-5 mr-3 text-purple-400 shrink-0 mt-0.5" />
                            <p>{STRINGS[lang].checklist.wipoTip}</p>
                        </div>

                        {/* Botón para vaciar y comenzar nueva patente */}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleResetAll}
                                className="text-xs text-gray-400 hover:text-red-300 flex items-center gap-1.5 transition-colors py-1 px-3 rounded-lg hover:bg-white/5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{lang === 'es' ? 'Limpiar borrador y crear nueva solicitud' : 'Clear draft & start fresh'}</span>
                            </button>
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
                            patentData={patentData}
                            priorArtDoc={priorArtDoc}
                            inventionDescDoc={inventionDescDoc}
                            lang={lang}
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

            {/* Banner de Recuperación de Borrador Local */}
            {savedDraftFound && (
                <div className="w-full max-w-4xl mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-blue-950/80 border border-purple-500/40 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 z-40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600/30 rounded-xl text-purple-300">
                            <RotateCcw className="w-5 h-5 animate-spin-reverse" />
                        </div>
                        <div className="text-left text-xs">
                            <p className="font-bold text-white">
                                {lang === 'es' ? '¡Borrador guardado automáticamente detectado!' : 'Autosaved draft detected!'}
                            </p>
                            <p className="text-purple-200/80">
                                {lang === 'es' ? `Última edición (${savedDraftFound.date}): "${savedDraftFound.title}"` : `Last edited (${savedDraftFound.date}): "${savedDraftFound.title}"`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                            onClick={handleRestoreDraft}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm"
                        >
                            {lang === 'es' ? 'Restaurar' : 'Restore'}
                        </button>
                        <button
                            onClick={handleDiscardDraft}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition"
                        >
                            {lang === 'es' ? 'Descartar' : 'Dismiss'}
                        </button>
                    </div>
                </div>
            )}

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
            <ConnectLawyerModal
              isOpen={isLawyerModalOpen}
              onClose={() => setIsLawyerModalOpen(false)}
              patentData={patentData}
              patentType={patentType}
              classification={classification}
              lang={lang}
            />
        </div>
    );
};

// FIX: Add default export for the App component
export default App;