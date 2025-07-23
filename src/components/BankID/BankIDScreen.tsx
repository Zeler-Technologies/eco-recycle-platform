import React from 'react';

interface BankIDScreenProps {
  onComplete: () => void;
}

const BankIDScreen: React.FC<BankIDScreenProps> = ({ onComplete }) => {
  // Simulate BankID authentication process
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Simulate 4 seconds authentication

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* BankID Logo */}
      <div className="text-center mb-16 bankid-loading">
        <div className="mb-4">
          <svg
            width="120"
            height="80"
            viewBox="0 0 240 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto"
          >
            {/* BankID Logo Recreation */}
            <rect width="80" height="120" fill="white" rx="8" />
            <rect x="20" y="30" width="40" height="60" fill="black" rx="20" />
            <circle cx="40" cy="45" r="8" fill="white" />
            <circle cx="40" cy="75" r="8" fill="white" />
            <rect x="90" y="30" width="130" height="90" fill="white" rx="45" />
            <rect x="110" y="50" width="90" height="50" fill="black" rx="25" />
            <text
              x="120"
              y="140"
              fontSize="24"
              fontWeight="bold"
              fill="white"
              fontFamily="Cairo, sans-serif"
            >
              BankID
            </text>
          </svg>
        </div>
      </div>

      {/* Animated Curved Arrow */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
        <div className="curved-arrow">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 40 Q30 20 50 30"
              stroke="#EC4899"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="4 4"
              fill="none"
            />
            <polygon
              points="46,26 54,30 46,34"
              fill="#EC4899"
            />
          </svg>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '200ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '400ms' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BankIDScreen;