import React, { useState, useEffect } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
  lang: 'es' | 'en';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish, lang }) => {
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const isEs = lang === 'es';
    setSteps([
      {
        target: 'body',
        content: (
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2 text-[#0a2540]">
              {isEs ? 'Tour Interactivo (1/4) 🚀' : 'Interactive Tour (1/4) 🚀'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isEs 
                ? 'Estás a punto de iniciar un recorrido rápido de 4 pasos. Descubrirás cómo aprovechar nuestra Inteligencia Artificial para buscar patentes, estructurar tu estrategia legal y redactar todo tu documento como un experto.'
                : 'You are about to start a quick 4-step tour. Discover how to leverage our AI to search patents, structure your legal strategy, and draft your entire document like an expert.'}
            </p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '.tour-wizard-bar',
        placement: 'bottom',
        disableBeacon: true,
        content: (
          <div className="text-left">
            <h3 className="font-bold text-[#0a2540] mb-1">
              {isEs ? '🔍 Asistente de Vigilancia Tecnológica' : '🔍 Technical Surveillance Assistant'}
            </h3>
            <p className="text-sm text-slate-600">
              {isEs
                ? 'En la barra superior verás los 10 pasos hacia tu solicitud conforme a la OMPI. Nuestra IA buscará patentes mundiales similares por ti y estructurará tu invención paso a paso.'
                : 'In the top bar you will see the 10 steps toward your WIPO-compliant application. Our AI will search global patents for you and structure your invention step by step.'}
            </p>
          </div>
        ),
      },
      {
        target: '.tour-fto-chatbot',
        placement: 'top-start',
        disableBeacon: true,
        content: (
          <div className="text-left">
            <h3 className="font-bold text-[#0a2540] mb-1">
              {isEs ? '💬 Analista FTO Global' : '💬 Global FTO Analyst'}
            </h3>
            <p className="text-sm text-slate-600">
              {isEs
                ? 'LIA te acompaña en cualquier paso. Habla con ella para estructurar tu estrategia, crear ecuaciones de búsqueda y evaluar riesgos de infracción.'
                : 'LIA accompanies you at any step. Talk to her to structure your strategy, create search queries, and evaluate infringement risks.'}
            </p>
          </div>
        ),
      },
      {
        target: '.tour-next-button',
        placement: 'top',
        disableBeacon: true,
        content: (
          <div className="text-left">
            <h3 className="font-bold text-[#0a2540] mb-1">
              {isEs ? '¡Todo listo! ✨' : 'All set! ✨'}
            </h3>
            <p className="text-sm text-slate-600">
              {isEs
                ? 'Usa este botón para avanzar paso a paso por la redacción de tu patente guiada por inteligencia artificial.'
                : 'Use this button to advance step-by-step through your AI-guided patent drafting.'}
            </p>
          </div>
        ),
      }
    ]);
  }, [lang]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  const isEs = lang === 'es';
  const JoyrideAny = Joyride as any;

  return (
    <JoyrideAny
      steps={steps}
      run={run}
      continuous
      disableBeacon={true}
      beaconComponent={() => null}
      disableScrolling={true}
      disableOverlayClose={true}
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: true,
        options: {
          preventOverflow: {
            boundariesElement: 'window',
            boundary: 'viewport',
          },
          flip: {
            boundariesElement: 'window',
            boundary: 'viewport',
          },
        },
      }}
      styles={{
        beacon: { display: 'none', width: 0, height: 0, opacity: 0 },
        beaconInner: { display: 'none', width: 0, height: 0, opacity: 0 },
        beaconOuter: { display: 'none', width: 0, height: 0, opacity: 0 },
        options: {
          primaryColor: '#8b5cf6', // purple-500
          textColor: '#334155',    // slate-700
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
        },
        buttonNext: {
          backgroundColor: '#8b5cf6',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#64748b',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#94a3b8',
        },
        tooltipContainer: {
          textAlign: 'left',
        }
      } as any}
      locale={{
        back: isEs ? 'Atrás' : 'Back',
        close: isEs ? 'Cerrar' : 'Close',
        last: isEs ? 'Finalizar' : 'Finish',
        next: isEs ? 'Siguiente' : 'Next',
        skip: isEs ? 'Saltar' : 'Skip',
      }}
    />
  );
};
