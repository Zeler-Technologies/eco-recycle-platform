import React from 'react';

interface BillingDashboardProps {
  onBack: () => void;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ onBack }) => {
  return (
    <div>
      <h1>Billing Dashboard</h1>
      <button onClick={onBack}>Back</button>
    </div>
  );
};

export default BillingDashboard;