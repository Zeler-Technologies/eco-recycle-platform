import React from 'react';

interface BankIDLoadingProps {
  onComplete: () => void;
}

const BankIDLoading: React.FC<BankIDLoadingProps> = ({ onComplete }) => {
  React.useEffect(() => {
    // Simulate BankID authentication process
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // 3 seconds loading time

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* BankID Logo */}
      <div className="text-center mb-8">
        <div className="text-white text-6xl font-bold mb-2">iD</div>
        <div className="text-white text-xl font-semibold tracking-wider">BankID</div>
      </div>

      {/* Loading Animation */}
      <div className="relative">
        {/* Pink dot */}
        <div className="w-4 h-4 bg-pink-500 rounded-full animate-pulse"></div>
        
        {/* Animated arrow */}
        <div className="absolute -right-16 -top-2">
          <svg 
            width="60" 
            height="20" 
            viewBox="0 0 60 20" 
            className="text-pink-500"
          >
            <defs>
              <path
                id="arrow-path"
                d="M 0 10 Q 20 0 40 10 Q 50 15 55 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </defs>
            <use href="#arrow-path" className="animate-pulse" />
            <polygon
              points="50,6 58,10 50,14"
              fill="currentColor"
              className="animate-bounce"
            />
          </svg>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-white text-center mt-12 space-y-2">
        <p className="text-lg">Autentisering pågår...</p>
        <p className="text-sm text-gray-300">Använd din BankID-app</p>
      </div>

      {/* Progress indicator */}
      <div className="mt-8 w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-pink-500 rounded-full animate-pulse" style={{
          animation: 'progress 3s ease-in-out forwards'
        }}></div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default BankIDLoading;