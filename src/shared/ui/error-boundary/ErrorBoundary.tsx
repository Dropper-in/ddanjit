import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  appName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.appName ? ` / ${this.props.appName}` : ''}]`,
      error,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
            <b>앱 오류 발생</b>
            {this.props.appName && <span> — {this.props.appName}</span>}
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', opacity: 0.7 }}>
              {this.state.error?.message}
            </pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
