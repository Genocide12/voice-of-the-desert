'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary — catches client-side exceptions and shows a recovery screen
 * instead of a blank page. Offers "Clear data & reload" button which wipes
 * localStorage to recover from corrupted persisted state.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary] caught:', error, info);
  }

  handleReset = () => {
    try {
      // Clear all app-related localStorage to recover from corrupted state
      localStorage.removeItem('desert-game-store');
      localStorage.removeItem('desert-lang');
    } catch {
      /* ignore */
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
          <div className="text-5xl mb-4">🏜️</div>
          <h1 className="text-xl font-serif mb-2">Пустыня замолчала</h1>
          <p className="text-sm opacity-60 mb-6 max-w-xs">
            Что-то сбилось. Очисти следы и начни заново.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors min-h-[48px]"
          >
            Очистить и перезагрузить
          </button>
          {this.state.error && (
            <details className="mt-6 text-xs opacity-40 max-w-md text-left">
              <summary className="cursor-pointer">Детали ошибки</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
