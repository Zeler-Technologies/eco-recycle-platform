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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-white text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-white rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="white" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* BankID Logo - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center bankid-loading">
          {/* BankID Logo */}
          <div className="mb-8">
            <svg
              width="200"
              height="120"
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto"
            >
              {/* Main logo shape */}
              <path
                d="M20 20 H60 V80 H20 Z"
                fill="white"
                rx="4"
              />
              {/* Left part with curves */}
              <path
                d="M30 35 Q45 25 45 40 Q45 55 30 45 Z"
                fill="black"
              />
              <path
                d="M30 55 Q45 65 45 50 Q45 35 30 45 Z"
                fill="black"
              />
              
              {/* Right part - large D shape */}
              <path
                d="M70 20 H120 Q150 20 150 50 Q150 80 120 80 H70 Z"
                fill="white"
              />
              <path
                d="M85 35 H115 Q130 35 130 50 Q130 65 115 65 H85 Z"
                fill="black"
              />
            </svg>
            
            {/* BankID Text */}
            <div className="text-white text-2xl font-bold mt-4 tracking-wide">
              BankID
            </div>
          </div>
        </div>
      </div>

      {/* Animated Curved Arrow */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full h-32">
        <div className="curved-arrow relative w-full h-full">
          {/* Pink dot at start */}
          <div className="absolute bottom-8 left-16 w-3 h-3 bg-pink-500 rounded-full"></div>
          
          {/* Curved dotted line */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 300 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 80 Q150 20 250 60"
              stroke="#EC4899"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 6"
              fill="none"
            />
            {/* Arrow head */}
            <polygon
              points="240,55 250,60 240,65"
              fill="#EC4899"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BankIDScreen;