import { Component, type ReactNode } from 'react';
import { en } from '../../i18n/en';
import { zh } from '../../i18n/zh';
import { useLanguageStore } from '../../stores/languageStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const lang = useLanguageStore.getState().language;
      const t = lang === 'zh' ? zh : en;

      return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10 text-center max-w-md">
            <span className="material-symbols-outlined text-game-red text-6xl mb-4 block">
              error
            </span>
            <h2 className="text-2xl font-bold text-white mb-3">
              {t['common.errorTitle']}
            </h2>
            <p className="text-white/60 mb-8">
              {t['common.errorMessage']}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              {t['common.retry']}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
