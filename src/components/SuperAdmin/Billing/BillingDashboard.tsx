interface BillingDashboardProps {
  onBack: () => void;
}

export default function BillingDashboard({ onBack }: BillingDashboardProps) {
  return (
    <div>
      <h1>Billing Dashboard</h1>
      <p>Billing dashboard content will be implemented here.</p>
      <button onClick={onBack}>Back</button>
    </div>
  );
}