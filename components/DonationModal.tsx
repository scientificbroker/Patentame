import React, { useState } from 'react';
import { X, Copy, CheckCircle, Heart } from 'lucide-react';
import yapeQr from '../assets/yape-qr.jpeg';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'es' | 'en';
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, lang }) => {
  const [copied, setCopied] = useState(false);
  const isEs = lang === 'es';

  if (!isOpen) return null;

  const yapeNumber = "925 836 543"; // Formatted for display
  const yapeNumberRaw = "925836543"; // For copying
  const paypalLink = "https://www.paypal.me/DChaupisMeza";

  const handleCopy = () => {
    navigator.clipboard.writeText(yapeNumberRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-slate-50 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-200/50 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header content */}
        <div className="pt-8 px-6 pb-4 text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-purple-600 fill-purple-600" />
          </div>
          <p className="text-slate-800 font-medium text-[15px] leading-relaxed">
            {isEs 
              ? 'Si esta herramienta te ayudó a estructurar tu invención, considera apoyarme con un Yape o PayPal.' 
              : 'If this tool helped you structure your invention, consider supporting me with Yape or PayPal.'}
          </p>
          <p className="text-slate-500 text-xs mt-2">
            {isEs 
              ? 'PayPal disponible para nuestros hermanos en el exterior.' 
              : 'PayPal available for international users.'}
          </p>
        </div>

        {/* Yape Section */}
        <div className="px-6 pb-6">
          <div className="bg-[#74008B] rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-inner">
            {/* Yape logo SVG text approximation */}
            <div className="text-white font-bold italic text-2xl mb-3 tracking-tighter">
              yape
            </div>
            
            {/* QR Container */}
            <div className="bg-white p-3 rounded-xl shadow-lg w-48 h-48 mb-3 flex items-center justify-center">
              <img 
                src={yapeQr} 
                alt="Yape QR" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback si la imagen real aún no existe o falla
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/200?text=Reemplaza+con+tu+QR+Yape";
                }}
              />
            </div>
            
            <p className="text-white text-sm font-semibold mb-2">David William Chaupis Meza</p>
          </div>

          {/* Phone Number Copy */}
          <div className="mt-4 flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <div className="px-4 py-2 flex-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Celular</span>
              <div className="text-lg font-bold text-slate-800">{yapeNumber}</div>
            </div>
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white'
              }`}
            >
              {copied ? (
                <><CheckCircle size={16} /> Copiado</>
              ) : (
                <><Copy size={16} /> Copiar número</>
              )}
            </button>
          </div>

          {/* PayPal Section */}
          <div className="mt-6 text-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-50 text-slate-500 font-medium">o también por PayPal</span>
            </div>
          </div>

          <a 
            href={paypalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-[#0079C1] hover:bg-[#005a93] text-white rounded-xl font-bold transition-colors shadow-md"
          >
            Donar con PayPal
          </a>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-400 mt-5 italic">
            Proyecto independiente. Cualquier apoyo es voluntario.
          </p>
        </div>
      </div>
    </div>
  );
};
