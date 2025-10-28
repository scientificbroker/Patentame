import React, { useState } from 'react';
import { PencilIcon, QuestionMarkIcon, InfoIcon } from './icons';
import { isAiAvailable } from '../services/geminiService';

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
}

const SHARED_TEXTAREA_CLASSES = "w-full h-64 p-4 rounded-lg text-base leading-relaxed resize-none transition";

export const SectionInput: React.FC<SectionInputProps> = ({ 
    id, title, helpText, placeholder, wipoRecommendation, value, onValueChange, 
    onImprove, improveButtonText, isImproving,
    prediction, isPredicting, onAcceptPrediction, generatingDraftText
}) => {
  const aiEnabled = isAiAvailable();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && prediction && !value) {
      e.preventDefault();
      onAcceptPrediction();
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl shadow-lg border border-white/10 mb-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
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
        )}
      </div>
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