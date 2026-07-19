import React, { useState } from 'react';
import { PencilIcon, QuestionMarkIcon, InfoIcon } from './icons';
import { isAiAvailable, generateClaimTree, scanDescriptiveSufficiency, type ClaimTreeResult, type SufficiencyScanResult } from '../src/services/gemini';
import type { PatentData, UploadedFile, Language } from '../types';

interface SectionInputProps {
  id: string;
  title: string;
  helpText: string;
  placeholder: string;
  wipoRecommendation: string;
  value: string;
  onValueChange: (value: string) => void;
  onImprove: () => void;
  improveButtonText: string;
  isImproving: boolean;
  prediction: string | null;
  isPredicting: boolean;
  onAcceptPrediction: () => void;
  generatingDraftText: string;
  patentData?: PatentData;
  priorArtDoc?: UploadedFile | null;
  inventionDescDoc?: UploadedFile | null;
  lang?: Language;
}

const SHARED_TEXTAREA_CLASSES = "w-full h-64 p-4 rounded-lg text-base leading-relaxed resize-none transition";

export const SectionInput: React.FC<SectionInputProps> = ({ 
    id, title, helpText, placeholder, wipoRecommendation, value, onValueChange, 
    onImprove, improveButtonText, isImproving,
    prediction, isPredicting, onAcceptPrediction, generatingDraftText,
    patentData, priorArtDoc, inventionDescDoc, lang = 'es'
}) => {
  const aiEnabled = isAiAvailable();

  // State for Claim Tree Builder (id === 'claims')
  const [isGeneratingTree, setIsGeneratingTree] = useState(false);
  const [claimTree, setClaimTree] = useState<ClaimTreeResult | null>(null);

  // State for Descriptive Sufficiency Scanner (id === 'detailedDescription')
  const [isScanningSufficiency, setIsScanningSufficiency] = useState(false);
  const [sufficiencyReport, setSufficiencyReport] = useState<SufficiencyScanResult | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && prediction && !value) {
      e.preventDefault();
      onAcceptPrediction();
    }
  };

  const handleGenerateTree = async () => {
    if (!patentData || isGeneratingTree) return;
    setIsGeneratingTree(true);
    try {
      const result = await generateClaimTree(patentData, priorArtDoc || null, inventionDescDoc || null, lang as Language);
      setClaimTree(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTree(false);
    }
  };

  const handleScanSufficiency = async () => {
    if (!patentData || isScanningSufficiency || !value.trim()) return;
    setIsScanningSufficiency(true);
    try {
      const result = await scanDescriptiveSufficiency(value, patentData, lang as Language);
      setSufficiencyReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningSufficiency(false);
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg border border-white/10 mb-6 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <label htmlFor={id} className="text-xl font-semibold text-white flex items-center">
          {title}
          <div className="group relative ml-3">
            <QuestionMarkIcon className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white transition-colors" />
            <div className="absolute bottom-full mb-2 w-72 bg-gray-800 text-white text-sm rounded-lg py-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-xl">
              {helpText}
            </div>
          </div>
        </label>
        {aiEnabled && (
          <div className="flex flex-wrap items-center gap-2">
            {id === 'claims' && (
              <button
                onClick={handleGenerateTree}
                disabled={isGeneratingTree || !patentData}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 transition-all transform hover:scale-105"
              >
                {isGeneratingTree ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {lang === 'es' ? 'Estructurando Árbol...' : 'Structuring Tree...'}
                  </>
                ) : (
                  <>
                    <span>🌳 {lang === 'es' ? 'Redactar Árbol de Reivindicaciones (1 Principal + Dependientes)' : 'Draft Claim Tree (1 Independent + Dependents)'}</span>
                  </>
                )}
              </button>
            )}

            {id === 'detailedDescription' && (
              <button
                onClick={handleScanSufficiency}
                disabled={isScanningSufficiency || !value.trim()}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 transition-all transform hover:scale-105"
              >
                {isScanningSufficiency ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {lang === 'es' ? 'Escaneando Suficiencia...' : 'Scanning Sufficiency...'}
                  </>
                ) : (
                  <>
                    <span>🛡️ {lang === 'es' ? 'Escanear Suficiencia Técnica' : 'Scan Technical Sufficiency'}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onImprove}
              disabled={isImproving || !value}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#A100A0] to-[#6b21a8] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-[#b100b0] hover:to-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isImproving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {improveButtonText}...
                </>
              ) : (
                <>
                  <PencilIcon className="w-5 h-5 mr-2" />
                  {improveButtonText}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Claim Tree Visualizer Panel */}
      {id === 'claims' && claimTree && (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-500/20">
            <div>
              <h4 className="font-bold text-base text-emerald-300 flex items-center gap-2">
                <span>🌳 {lang === 'es' ? 'Árbol de Reivindicaciones Estructurado (Estándar OMPI / Decisión 486)' : 'Structured Claim Tree'}</span>
              </h4>
              <p className="text-xs text-emerald-200/70 mt-0.5">
                {lang === 'es' ? 'Reivindicación Principal Independiente (Preámbulo + Parte Caracterizadora) y Reivindicaciones Dependientes subordinadas.' : 'Independent Principal Claim + Subordinated Dependent Claims.'}
              </p>
            </div>
            <button
              onClick={() => {
                onValueChange(claimTree.formattedText);
                setClaimTree(null);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
            >
              <span>📋 {lang === 'es' ? 'Aplicar al Editor' : 'Apply to Editor'}</span>
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/30">
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/40">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {lang === 'es' ? 'Reivindicación 1 (Principal / Independiente)' : 'Claim 1 (Independent)'}
              </div>
              <p className="text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap">{claimTree.independentClaim}</p>
            </div>

            {claimTree.dependentClaims.map((dep, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/25 border border-emerald-500/20 ml-4">
                <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  {lang === 'es' ? `Reivindicación Dependiente #${idx + 2}` : `Dependent Claim #${idx + 2}`}
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{dep}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descriptive Sufficiency Scanner Panel */}
      {id === 'detailedDescription' && sufficiencyReport && (
        <div className="mb-6 p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-100 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-blue-500/20">
            <div>
              <h4 className="font-bold text-base text-blue-300 flex items-center gap-2">
                <span>🛡️ {lang === 'es' ? 'Dictamen de Suficiencia Descriptiva (Artículo 83 EPO / Decisión 486)' : 'Descriptive Sufficiency Report'}</span>
              </h4>
              <p className="text-xs text-blue-200/80 mt-0.5">{sufficiencyReport.summary}</p>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-blue-500/30">
              <span className="text-xs font-semibold text-gray-300">{lang === 'es' ? 'Índice de Repetibilidad:' : 'Enablement Score:'}</span>
              <span className={`text-sm font-black ${sufficiencyReport.score >= 80 ? 'text-green-400' : sufficiencyReport.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {sufficiencyReport.score}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {sufficiencyReport.missingDetails.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/30 border border-amber-500/30">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>⚠️ {lang === 'es' ? 'Puntos Ciegos o Falta de Detalle' : 'Blind Spots / Missing Details'}</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-amber-100/90 list-disc list-inside">
                  {sufficiencyReport.missingDetails.map((item, i) => (
                    <li key={i} className="leading-tight">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {sufficiencyReport.recommendations.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/30 border border-blue-500/30">
                <h5 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>💡 {lang === 'es' ? 'Recomendaciones de Blindaje Legal' : 'Legal Hardening Recommendations'}</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-blue-100/90 list-disc list-inside">
                  {sufficiencyReport.recommendations.map((item, i) => (
                    <li key={i} className="leading-tight">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative">
          <textarea
            readOnly
            value={prediction && !value ? prediction : ''}
            className={`${SHARED_TEXTAREA_CLASSES} absolute inset-0 bg-transparent border-transparent text-gray-500 pointer-events-none`}
            tabIndex={-1}
          />
          <textarea
            id={id}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isPredicting ? `${generatingDraftText}...` : (prediction && !value ? '' : placeholder)}
            className={`${SHARED_TEXTAREA_CLASSES} relative bg-white/5 border border-white/20 text-gray-200 focus:ring-2 focus:ring-[#A100A0] focus:border-transparent shadow-inner placeholder-gray-400`}
            style={{ background: 'transparent' }}
          />
           {prediction && !value && !isPredicting && (
             <div className="absolute bottom-2 right-3 text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                Press <kbd className="font-sans border border-gray-600 rounded px-1.5 py-0.5">Tab</kbd> to accept
             </div>
           )}
           {isPredicting && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
           )}
      </div>
      {wipoRecommendation && (
        <div className="mt-4 p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg text-sm text-purple-200/90 flex items-start">
            <InfoIcon className="h-5 w-5 mr-3 text-purple-400 shrink-0 mt-0.5" />
            <p>{wipoRecommendation}</p>
        </div>
      )}
    </div>
  );
};