'use client';

import { Component, ReactNode } from 'react';
import { Button, Card, CardContent } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="mx-auto max-w-lg px-4 py-16">
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-exposure-elevated text-4xl mb-4">!</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Something went wrong
              </h2>
              <p className="text-text-secondary mb-6 text-sm">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
