import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isModuleError = this.state.error?.message?.includes('Failed to fetch dynamically imported module');
      
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
            <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                {isModuleError ? 'Module Load Error' : 'Something went wrong'}
              </h2>
              <p className="text-sm text-slate-600">
                {isModuleError 
                  ? 'Failed to load the requested page. This may be a temporary server issue.'
                  : 'An unexpected error occurred while loading the application.'}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 font-mono max-h-24 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>

            <p className="text-xs text-slate-500 text-center">
              If the problem persists, please clear your browser cache or try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
