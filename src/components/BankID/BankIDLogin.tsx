import React from 'react';

interface BankIDLoginProps {
  onLoginSuccess: () => void;
}

const BankIDLogin: React.FC<BankIDLoginProps> = ({ onLoginSuccess }) => {
  const handleBankIDLogin = () => {
    // Simulate BankID login process
    setTimeout(() => {
      onLoginSuccess();
    }, 2000);
  };

  const handleAlternativeLogin = () => {
    // Handle alternative login method
    console.log('Alternative login method');
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col relative overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Pantabilen Logo */}
        <div className="mb-12">
          <div className="mb-4">
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto"
            >
              {/* Stylized car/transportation logo */}
              <path
                d="M20 35 C20 30, 25 25, 35 25 L85 25 C95 25, 100 30, 100 35 L100 45 C100 50, 95 55, 85 55 L35 55 C25 55, 20 50, 20 45 Z"
                fill="#1F2937"
                stroke="#1F2937"
                strokeWidth="2"
              />
              {/* Arrow pointing left */}
              <path
                d="M15 40 L25 35 L25 37.5 L35 37.5 L35 42.5 L25 42.5 L25 45 Z"
                fill="#1F2937"
              />
              {/* Arrow pointing right */}
              <path
                d="M105 40 L95 35 L95 37.5 L85 37.5 L85 42.5 L95 42.5 L95 45 Z"
                fill="#1F2937"
              />
            </svg>
          </div>
          <div className="text-black text-sm font-bold tracking-wide">
            PANTABILEN
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-black mb-4">
            Logga in med BankID
          </h1>
          <p className="text-black text-lg leading-relaxed max-w-sm">
            Dags att ge din bil ett nytt liv – och bidra till en grönare framtid.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleBankIDLogin}
            className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Öppna BankID</span>
          </button>
          
          <button
            onClick={handleAlternativeLogin}
            className="w-full bg-transparent border-2 border-black text-black py-4 rounded-full font-semibold text-lg"
          >
            BankID på annan enhet
          </button>
        </div>
      </div>

      {/* Bottom Navigation Indicator */}
      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default BankIDLogin;