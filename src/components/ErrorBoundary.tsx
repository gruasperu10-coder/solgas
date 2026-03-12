import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ha ocurrido un error inesperado.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Error de base de datos: ${parsed.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">¡Ups! Algo salió mal</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {isFirestoreError && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Sugerencia</p>
                <p className="text-xs text-amber-700">
                  Esto puede deberse a permisos insuficientes. Asegúrate de estar autenticado correctamente.
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
