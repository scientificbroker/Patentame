import React, { ErrorInfo, ReactNode } from 'react';

export interface Props {
  children: ReactNode;
  fallbackText?: string;
  onReset?: () => void;
  key?: React.Key;
}

export interface State {
  hasError: boolean;
  error: Error | null;
}

const BaseComponent = React.Component as any;

export class ErrorBoundary extends BaseComponent {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-950/40 border border-red-500/30 rounded-2xl text-center max-w-xl mx-auto my-8 backdrop-blur-md shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/40">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-red-300 mb-2">
            ¡Ocurrió un error inesperado al cargar esta sección!
          </h3>
          <p className="text-sm text-red-200/80 mb-6 max-w-md">
            {this.props.fallbackText || 'El sistema protegió tus datos para evitar un cierre inesperado. Por favor, recarga o vuelve al paso anterior.'}
          </p>
          {this.state.error && (
            <div className="w-full bg-black/40 border border-red-500/20 rounded-lg p-3 text-left mb-6 overflow-x-auto">
              <p className="text-xs font-mono text-red-400 break-all">
                {this.state.error.message || this.state.error.toString()}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg transition-all transform hover:scale-105"
            >
              🔄 Reintentar / Continuar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
