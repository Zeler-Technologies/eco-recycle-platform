import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if this is a DOM manipulation error that we can handle gracefully
    if (error.name === 'NotFoundError' || 
        error.message.includes('removeChild') ||
        error.message.includes('Node')) {
      console.warn('Map DOM conflict detected, using fallback:', error.message);
      return { hasError: true };
    }
    
    // For other errors, let them bubble up
    throw error;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Map error boundary caught DOM error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-96 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm">Kartan kunde inte laddas</div>
            <div className="text-xs mt-1">Försök uppdatera sidan</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;