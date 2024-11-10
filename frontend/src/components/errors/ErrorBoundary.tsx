import React, { Component, ReactNode } from 'react';
import { Button } from "@material-tailwind/react";
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught in ErrorBoundary:", {
      error,
      componentStack: errorInfo.componentStack,
      errorInfo
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return <this.props.fallbackComponent
          error={this.state.error!}
          reset={this.handleRetry}
        />;
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-semibold text-red-700">
              Something went wrong
            </h1>
          </div>

          <div className="text-red-600 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={this.handleRetry}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              placeholder=""
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded-lg overflow-auto">
                <code>
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:\n'}
                  {this.state.errorInfo?.componentStack}
                </code>
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;