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
      return (
        <div className="h-[500px] rounded-xl border border-border overflow-hidden">
          <SimpleMapFallback />
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component that tries to render a basic Google Map
const SimpleMapFallback = () => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    
    const initFallbackMap = () => {
      if (!mounted || !window.google?.maps || !mapRef.current) return;
      
      try {
        new window.google.maps.Map(mapRef.current, {
          center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
          zoom: 12,
          clickableIcons: false,
          disableDefaultUI: true,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
        
        if (mounted) setMapLoaded(true);
      } catch (error) {
        console.warn('Fallback map failed to load:', error);
      }
    };

    const checkAndInit = () => {
      if (window.google?.maps) {
        setTimeout(initFallbackMap, 200); // Extra delay for stability
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm">Laddar reservkarta...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapErrorBoundary;