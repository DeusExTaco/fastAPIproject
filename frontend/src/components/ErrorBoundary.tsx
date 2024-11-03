import React, {Component, ReactNode} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
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
    // Reset the error state to trigger a re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Enhanced error UI with retry button
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h1 className="text-xl font-semibold text-red-700 mb-2">
            Something went wrong
          </h1>
          <div className="text-red-600 mb-4">
            {this.state.error?.message}
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-700 cursor-pointer">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
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