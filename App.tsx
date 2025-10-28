

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PatentData, PatentSectionKey, PatentType, Language, UploadedFile } from './types';
import { SectionInput } from './components/SectionInput';
import { improveText, isAiAvailable, generateDraft } from './services/geminiService';
import { SparklesIcon, DownloadIcon, UploadIcon, PencilIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, FileTextIcon, GithubIcon, InfoIcon } from './components/icons';
import { STRINGS, getSectionDetails } from './data/i18n';


// New Components
const LanguageSwitcher = ({ lang, setLang }: { lang: Language; setLang: (lang: Language) => void; }) => (
    <div className="absolute top-6 right-6 flex items-center space-x-2 rounded-full p-1 bg-white/10">
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

    const SECTIONS = useMemo(() => getSectionDetails(lang), [lang]);
    const WIZARD_STEPS = useMemo(() => [
        { name: STRINGS[lang].steps.welcome, isComplete: patentType !== null },
        { name: STRINGS[lang].steps.upload, isComplete: priorArtDoc !== null || inventionDescDoc !== null },
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
        }
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
                    <div className="text-center">
                        <h2 className="text-4xl font-bold mb-4">{STRINGS[lang].welcome.title}</h2>
                        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{STRINGS[lang].welcome.subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                           <button onClick={() => setPatentType('invention')} className={`w-full p-6 rounded-xl border-2 transition-all ${patentType === 'invention' ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:bg-white/5'}`}>
                               <h3 className="text-xl font-semibold">{STRINGS[lang].welcome.invention}</h3>
                               <p className="text-sm text-gray-400 mt-1">{STRINGS[lang].welcome.inventionDesc}</p>
                           </button>
                           <button onClick={() => setPatentType('utilityModel')} className={`w-full p-6 rounded-xl border-2 transition-all ${patentType === 'utilityModel' ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:bg-white/5'}`}>
                               <h3 className="text-xl font-semibold">{STRINGS[lang].welcome.utilityModel}</h3>
                               <p className="text-sm text-gray-400 mt-1">{STRINGS[lang].welcome.utilityModelDesc}</p>
                           </button>
                        </div>
                         <div className="mt-8 max-w-3xl mx-auto text-xs text-gray-400 text-center">
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
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{STRINGS[lang].upload.title}</h2>
                        <p className="text-gray-400 mb-6">{STRINGS[lang].upload.subtitle}</p>
                        <div className="space-y-6">
                            <FileInput id="prior-art-file" label={STRINGS[lang].upload.priorArt} file={priorArtDoc} onChange={handleFileChange(setPriorArtDoc)} />
                            <FileInput id="invention-desc-file" label={STRINGS[lang].upload.inventionDesc} file={inventionDescDoc} onChange={handleFileChange(setInventionDescDoc)} />
                        </div>
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
        <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <div className="w-full max-w-7xl mx-auto">
                 <header className="mb-8">
                     <div className="flex items-center justify-center mb-2">
                         <SparklesIcon className="w-8 h-8 text-purple-400 mr-3" />
                         <h1 className="text-4xl font-bold text-center">Patentame</h1>
                     </div>
                      { !isAiAvailable() && (
                        <div className="max-w-3xl mx-auto bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm p-3 rounded-lg text-center" role="alert">
                            {STRINGS[lang].aiWarning}
                        </div>
                    )}
                </header>
                
                {/* Wizard Progress Bar */}
                 <div className="w-full overflow-x-auto pb-4 mb-8">
                    <div className="flex items-start justify-between min-w-[800px]">
                        {WIZARD_STEPS.map((s, index) => (
                             <div className="flex-1 flex items-start" key={`${s.name}-${index}`}>
                                <div className="flex flex-col items-center w-20 text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${
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
                    {renderStepContent()}
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
                        className="flex items-center px-6 py-2 bg-gradient-to-r from-[#A100A0] to-[#6b21a8] text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-[#b100b0] hover:to-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
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
        </div>
    );
};

// FIX: Add default export for the App component
export default App;